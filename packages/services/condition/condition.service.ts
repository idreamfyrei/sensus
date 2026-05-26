import {
  and,
  eq,
  fieldConditionsTable,
  formFieldsTable,
  formSectionsTable,
  formsTable,
  notDeleted,
  sql,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";
import { FormForbiddenError, FormNotFoundError, FormSchemaLockedError } from "../form/form.service";
import type { Action, Operator } from "./evaluator";

type FieldCondition = typeof fieldConditionsTable.$inferSelect;

export class ConditionNotFoundError extends Error {
  readonly code = "CONDITION_NOT_FOUND" as const;
  constructor() {
    super("Condition not found");
    this.name = "ConditionNotFoundError";
  }
}

export class ConditionInvalidTargetError extends Error {
  readonly code = "CONDITION_INVALID_TARGET" as const;
  constructor(message: string) {
    super(message);
    this.name = "ConditionInvalidTargetError";
  }
}

type ConditionPatch = Partial<{
  operator: Operator;
  value: string | null;
  action: Action;
  targetFieldId: string | null;
  targetSectionId: string | null;
}>;

export class ConditionService {
  constructor(private readonly db: Database) {}

  private async assertEditable(args: { formId: string; userId: string }): Promise<void> {
    const [form] = await this.db
      .select({ userId: formsTable.userId, status: formsTable.status })
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

  private async assertFieldInForm(formId: string, fieldId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: formFieldsTable.id })
      .from(formFieldsTable)
      .where(
        and(
          eq(formFieldsTable.id, fieldId),
          eq(formFieldsTable.formId, formId),
          notDeleted(formFieldsTable.deletedAt),
        ),
      );
    if (!row) {
      throw new ConditionInvalidTargetError(`Field ${fieldId} does not belong to this form`);
    }
  }

  private async assertSectionInForm(formId: string, sectionId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: formSectionsTable.id })
      .from(formSectionsTable)
      .where(
        and(
          eq(formSectionsTable.id, sectionId),
          eq(formSectionsTable.formId, formId),
          notDeleted(formSectionsTable.deletedAt),
        ),
      );
    if (!row) {
      throw new ConditionInvalidTargetError(`Section ${sectionId} does not belong to this form`);
    }
  }

  private assertXor(targetFieldId: string | null, targetSectionId: string | null): void {
    const hasField = targetFieldId !== null;
    const hasSection = targetSectionId !== null;
    if (hasField === hasSection) {
      throw new ConditionInvalidTargetError("Set exactly one of targetFieldId or targetSectionId");
    }
  }

  async listByForm(args: { formId: string; userId: string }): Promise<FieldCondition[]> {
    const [form] = await this.db
      .select({ userId: formsTable.userId })
      .from(formsTable)
      .where(and(eq(formsTable.id, args.formId), notDeleted(formsTable.deletedAt)));
    if (!form) throw new FormNotFoundError();
    if (form.userId !== args.userId) throw new FormForbiddenError();

    return this.db
      .select()
      .from(fieldConditionsTable)
      .where(
        and(
          eq(fieldConditionsTable.formId, args.formId),
          notDeleted(fieldConditionsTable.deletedAt),
        ),
      )
      .orderBy(fieldConditionsTable.createdAt);
  }

  async addCondition(args: {
    formId: string;
    userId: string;
    sourceFieldId: string;
    operator: Operator;
    value: string | null;
    action: Action;
    targetFieldId: string | null;
    targetSectionId: string | null;
  }): Promise<FieldCondition> {
    await this.assertEditable({ formId: args.formId, userId: args.userId });
    this.assertXor(args.targetFieldId, args.targetSectionId);
    await this.assertFieldInForm(args.formId, args.sourceFieldId);
    if (args.targetFieldId) await this.assertFieldInForm(args.formId, args.targetFieldId);
    if (args.targetSectionId) await this.assertSectionInForm(args.formId, args.targetSectionId);

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(fieldConditionsTable)
        .values({
          formId: args.formId,
          sourceFieldId: args.sourceFieldId,
          operator: args.operator,
          value: args.value,
          action: args.action,
          targetFieldId: args.targetFieldId,
          targetSectionId: args.targetSectionId,
        })
        .returning();
      if (!row) throw new Error("ConditionService.addCondition: insert returned nothing");
      await this.bumpVersion(tx, args.formId);
      logger.info("condition added", {
        conditionId: row.id,
        formId: args.formId,
        action: args.action,
      });
      return row;
    });
  }

  async updateCondition(args: {
    conditionId: string;
    userId: string;
    patch: ConditionPatch;
  }): Promise<FieldCondition> {
    const [existing] = await this.db
      .select()
      .from(fieldConditionsTable)
      .where(
        and(
          eq(fieldConditionsTable.id, args.conditionId),
          notDeleted(fieldConditionsTable.deletedAt),
        ),
      );
    if (!existing) throw new ConditionNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    const nextTargetField =
      "targetFieldId" in args.patch ? (args.patch.targetFieldId ?? null) : existing.targetFieldId;
    const nextTargetSection =
      "targetSectionId" in args.patch
        ? (args.patch.targetSectionId ?? null)
        : existing.targetSectionId;
    this.assertXor(nextTargetField, nextTargetSection);
    if (nextTargetField !== null && nextTargetField !== existing.targetFieldId) {
      await this.assertFieldInForm(existing.formId, nextTargetField);
    }
    if (nextTargetSection !== null && nextTargetSection !== existing.targetSectionId) {
      await this.assertSectionInForm(existing.formId, nextTargetSection);
    }

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(fieldConditionsTable)
        .set({
          ...args.patch,
          targetFieldId: nextTargetField,
          targetSectionId: nextTargetSection,
        })
        .where(eq(fieldConditionsTable.id, args.conditionId))
        .returning();
      if (!row) throw new ConditionNotFoundError();
      await this.bumpVersion(tx, existing.formId);
      return row;
    });
  }

  async deleteCondition(args: { conditionId: string; userId: string }): Promise<void> {
    const [existing] = await this.db
      .select({ formId: fieldConditionsTable.formId })
      .from(fieldConditionsTable)
      .where(
        and(
          eq(fieldConditionsTable.id, args.conditionId),
          notDeleted(fieldConditionsTable.deletedAt),
        ),
      );
    if (!existing) throw new ConditionNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    await this.db.transaction(async (tx) => {
      await tx
        .update(fieldConditionsTable)
        .set({ deletedAt: new Date() })
        .where(eq(fieldConditionsTable.id, args.conditionId));
      await this.bumpVersion(tx, existing.formId);
    });
  }
}
