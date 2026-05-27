import {
  and,
  eq,
  sql,
  fieldOptionsTable,
  formFieldsTable,
  formsTable,
  notDeleted,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";
import { FIELD_TYPES_CATALOG, type FieldType } from "@repo/schemas";
import { FormForbiddenError, FormNotFoundError, FormSchemaLockedError } from "../form/form.service";

type Field = typeof formFieldsTable.$inferSelect;
type FieldOption = typeof fieldOptionsTable.$inferSelect;

export class FieldNotFoundError extends Error {
  readonly code = "FIELD_NOT_FOUND" as const;
  constructor() {
    super("Field not found");
    this.name = "FieldNotFoundError";
  }
}

export class FieldOptionsRequiredError extends Error {
  readonly code = "FIELD_OPTIONS_REQUIRED" as const;
  constructor() {
    super("This field type requires at least one option");
    this.name = "FieldOptionsRequiredError";
  }
}

type FieldPatch = Partial<{
  label: string;
  description: string | null;
  placeholder: string | null;
  required: boolean;
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  pattern: string | null;
  isInteger: boolean | null;
  includeTime: boolean | null;
  maxRating: number | null;
  minSelected: number | null;
  maxSelected: number | null;
}>;

export class FieldService {
  constructor(private readonly db: Database) {}

  private async assertEditable(args: { formId: string; userId: string }): Promise<void> {
    const [form] = await this.db
      .select({
        userId: formsTable.userId,
        status: formsTable.status,
      })
      .from(formsTable)
      .where(and(eq(formsTable.id, args.formId), notDeleted(formsTable.deletedAt)));
    if (!form) throw new FormNotFoundError();
    if (form.userId !== args.userId) throw new FormForbiddenError();
    if (form.status !== "draft") throw new FormSchemaLockedError();
  }

  private async bumpVersion(
    tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
    formId: string,
  ): Promise<void> {
    await tx
      .update(formsTable)
      .set({ version: sql`${formsTable.version} + 1` })
      .where(eq(formsTable.id, formId));
  }

  async addField(args: {
    formId: string;
    userId: string;
    sectionId: string;
    type: FieldType;
    label: string;
  }): Promise<Field> {
    await this.assertEditable({ formId: args.formId, userId: args.userId });

    const existing = await this.db
      .select({ order: formFieldsTable.order })
      .from(formFieldsTable)
      .where(
        and(eq(formFieldsTable.sectionId, args.sectionId), notDeleted(formFieldsTable.deletedAt)),
      );
    const nextOrder = existing.reduce((m, r) => Math.max(m, r.order), -1) + 1;

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(formFieldsTable)
        .values({
          formId: args.formId,
          sectionId: args.sectionId,
          type: args.type,
          label: args.label,
          order: nextOrder,
          required: false,
        })
        .returning();
      if (!row) throw new Error("FieldService.addField: insert returned nothing");
      await this.bumpVersion(tx, args.formId);
      logger.info("field added", { fieldId: row.id, formId: args.formId, type: args.type });
      return row;
    });
  }

  async updateField(args: { fieldId: string; userId: string; patch: FieldPatch }): Promise<Field> {
    const [existing] = await this.db
      .select({ formId: formFieldsTable.formId })
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.id, args.fieldId), notDeleted(formFieldsTable.deletedAt)));
    if (!existing) throw new FieldNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(formFieldsTable)
        .set(args.patch)
        .where(eq(formFieldsTable.id, args.fieldId))
        .returning();
      if (!row) throw new FieldNotFoundError();
      await this.bumpVersion(tx, existing.formId);
      return row;
    });
  }

  async deleteField(args: { fieldId: string; userId: string }): Promise<void> {
    const [existing] = await this.db
      .select({ formId: formFieldsTable.formId })
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.id, args.fieldId), notDeleted(formFieldsTable.deletedAt)));
    if (!existing) throw new FieldNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    await this.db.transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(formFieldsTable)
        .set({ deletedAt: now })
        .where(eq(formFieldsTable.id, args.fieldId));
      await tx
        .update(fieldOptionsTable)
        .set({ deletedAt: now })
        .where(eq(fieldOptionsTable.fieldId, args.fieldId));
      await this.bumpVersion(tx, existing.formId);
    });
  }

  async reorderAllFields(args: {
    formId: string;
    userId: string;
    sections: ReadonlyArray<{ sectionId: string; fieldIds: ReadonlyArray<string> }>;
  }): Promise<void> {
    await this.assertEditable({ formId: args.formId, userId: args.userId });

    const live = await this.db
      .select({ id: formFieldsTable.id })
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.formId, args.formId), notDeleted(formFieldsTable.deletedAt)));
    const liveIds = new Set(live.map((r) => r.id));

    const seen = new Set<string>();
    for (const section of args.sections) {
      for (const fieldId of section.fieldIds) {
        if (!liveIds.has(fieldId)) throw new FieldNotFoundError();
        if (seen.has(fieldId)) throw new FieldNotFoundError();
        seen.add(fieldId);
      }
    }
    if (seen.size !== liveIds.size) throw new FieldNotFoundError();

    await this.db.transaction(async (tx) => {
      for (const section of args.sections) {
        for (let i = 0; i < section.fieldIds.length; i++) {
          const fieldId = section.fieldIds[i];
          if (!fieldId) continue;
          await tx
            .update(formFieldsTable)
            .set({ sectionId: section.sectionId, order: i })
            .where(and(eq(formFieldsTable.id, fieldId), eq(formFieldsTable.formId, args.formId)));
        }
      }
      await this.bumpVersion(tx, args.formId);
    });
  }

  async setOptions(args: {
    fieldId: string;
    userId: string;
    options: Array<{ label: string; value: string }>;
  }): Promise<FieldOption[]> {
    const [field] = await this.db
      .select({ formId: formFieldsTable.formId, type: formFieldsTable.type })
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.id, args.fieldId), notDeleted(formFieldsTable.deletedAt)));
    if (!field) throw new FieldNotFoundError();
    await this.assertEditable({ formId: field.formId, userId: args.userId });

    const def = FIELD_TYPES_CATALOG[field.type];
    if (!def.hasOptions) {
      throw new Error(`Field type '${field.type}' does not accept options`);
    }

    return this.db.transaction(async (tx) => {
      await tx
        .update(fieldOptionsTable)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(fieldOptionsTable.fieldId, args.fieldId), notDeleted(fieldOptionsTable.deletedAt)),
        );

      const inserted =
        args.options.length === 0
          ? []
          : await tx
              .insert(fieldOptionsTable)
              .values(
                args.options.map((o, i) => ({
                  fieldId: args.fieldId,
                  label: o.label,
                  value: o.value,
                  order: i,
                })),
              )
              .returning();

      await this.bumpVersion(tx, field.formId);
      return inserted;
    });
  }
}
