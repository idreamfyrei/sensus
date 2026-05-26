import {
  and,
  eq,
  inArray,
  fieldOptionsTable,
  formFieldsTable,
  formSectionsTable,
  formsTable,
  responsesTable,
  responseAnswersTable,
  notDeleted,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";
import { FIELD_TYPES_CATALOG, getFieldTypeDef } from "@repo/schemas";
import { generateSlug } from "./slug";

type Form = typeof formsTable.$inferSelect;
type FormSection = typeof formSectionsTable.$inferSelect;
type FormField = typeof formFieldsTable.$inferSelect;
type FieldOption = typeof fieldOptionsTable.$inferSelect;

export type FormWithSchema = Form & {
  sections: Array<
    FormSection & {
      fields: Array<FormField & { options: FieldOption[] }>;
    }
  >;
};

export type CreateFormServiceInput = {
  title: string;
  description?: string | null;
  themeId: string;
};

export class FormNotFoundError extends Error {
  readonly code = "FORM_NOT_FOUND" as const;
  constructor() {
    super("Form not found");
    this.name = "FormNotFoundError";
  }
}

export class FormForbiddenError extends Error {
  readonly code = "FORM_FORBIDDEN" as const;
  constructor() {
    super("You don't own this form");
    this.name = "FormForbiddenError";
  }
}

export class FormVersionMismatchError extends Error {
  readonly code = "FORM_VERSION_MISMATCH" as const;
  constructor() {
    super("Form was edited in another tab — reload and try again");
    this.name = "FormVersionMismatchError";
  }
}

export class FormNotPublishedError extends Error {
  readonly code = "FORM_NOT_PUBLISHED" as const;
  constructor() {
    super("Form is not accepting responses");
    this.name = "FormNotPublishedError";
  }
}

export class InvalidAnswerError extends Error {
  readonly code = "INVALID_ANSWER" as const;
  constructor(
    public readonly fieldId: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidAnswerError";
  }
}

export class FormPublishFieldOptionsMissingError extends Error {
  readonly code = "FIELD_OPTIONS_REQUIRED" as const;
  constructor() {
    super("All select-style fields need at least one option before publishing");
    this.name = "FormPublishFieldOptionsMissingError";
  }
}

export class FormService {
  constructor(private readonly db: Database) {}

  async create(args: { userId: string; input: CreateFormServiceInput }): Promise<Form> {
    const slug = generateSlug(args.input.title);

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(formsTable)
        .values({
          userId: args.userId,
          title: args.input.title,
          description: args.input.description ?? null,
          themeId: args.input.themeId,
          slug,
        })
        .returning();
      if (!row) throw new Error("FormService.create: insert returned nothing");

      // Auto-create the default section. Phase 5 will expose section editing.
      await tx.insert(formSectionsTable).values({ formId: row.id, order: 0 });

      logger.info("form created", { id: row.id, userId: args.userId, slug });
      return row;
    });
  }

  async getById(args: { id: string; userId: string }): Promise<Form> {
    const [row] = await this.db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.id, args.id), notDeleted(formsTable.deletedAt)));
    if (!row) throw new FormNotFoundError();
    if (row.userId !== args.userId) throw new FormForbiddenError();
    return row;
  }

  async getByIdWithSchema(args: { id: string; userId: string }): Promise<FormWithSchema> {
    const form = await this.getById(args);
    return this.attachSchema(form);
  }

  async listByUser(args: { userId: string }): Promise<Form[]> {
    return this.db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.userId, args.userId), notDeleted(formsTable.deletedAt)));
  }

  async publish(args: { id: string; userId: string; version: number }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.version !== args.version) throw new FormVersionMismatchError();

    // Publish gate: every select-style field must have ≥1 option.
    const selectFields = await this.db
      .select({ id: formFieldsTable.id, type: formFieldsTable.type })
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.formId, args.id), notDeleted(formFieldsTable.deletedAt)));

    for (const f of selectFields) {
      if (!FIELD_TYPES_CATALOG[f.type].hasOptions) continue;
      const [opt] = await this.db
        .select({ id: fieldOptionsTable.id })
        .from(fieldOptionsTable)
        .where(and(eq(fieldOptionsTable.fieldId, f.id), notDeleted(fieldOptionsTable.deletedAt)))
        .limit(1);
      if (!opt) throw new FormPublishFieldOptionsMissingError();
    }

    const [updated] = await this.db
      .update(formsTable)
      .set({ status: "published", version: existing.version + 1 })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.publish: update returned nothing");
    logger.info("form published", { id: updated.id, userId: args.userId });
    return updated;
  }

  async getBySlug(args: { slug: string }): Promise<Form> {
    const [row] = await this.db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.slug, args.slug), notDeleted(formsTable.deletedAt)));
    if (!row) throw new FormNotFoundError();
    return row;
  }

  async getBySlugWithSchema(args: { slug: string }): Promise<FormWithSchema> {
    const form = await this.getBySlug(args);
    return this.attachSchema(form);
  }

  async submit(args: {
    slug: string;
    answers: ReadonlyArray<{ fieldId: string; value: unknown }>;
  }): Promise<{ responseId: string }> {
    const form = await this.getBySlugWithSchema({ slug: args.slug });
    if (form.status !== "published") throw new FormNotPublishedError();

    // Build a fast lookup of all fields on the form (with their options).
    const fieldsById = new Map<
      string,
      {
        type: keyof typeof FIELD_TYPES_CATALOG;
        field: (typeof form.sections)[number]["fields"][number];
      }
    >();
    for (const section of form.sections) {
      for (const f of section.fields) {
        fieldsById.set(f.id, { type: f.type, field: f });
      }
    }

    const submittedByFieldId = new Map<string, unknown>();
    for (const a of args.answers) submittedByFieldId.set(a.fieldId, a.value);

    // Validate every field on the form (catches missing required + bad shapes).
    const rowsToInsert: Array<{
      formFieldId: string;
      valueText: string | null;
      valueJson: unknown | null;
    }> = [];

    for (const [fieldId, { field }] of fieldsById) {
      const def = getFieldTypeDef(field.type);
      const optionValues = field.options.map((o) => o.value);
      const schema = def.buildAnswerSchema(field, optionValues);
      const raw = submittedByFieldId.get(fieldId);

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        throw new InvalidAnswerError(fieldId, parsed.error.issues[0]?.message ?? "Invalid value");
      }

      if (parsed.data === undefined || parsed.data === "" || parsed.data === null) {
        continue; // optional + empty → skip the row
      }

      rowsToInsert.push({
        formFieldId: fieldId,
        valueText: def.answerKind === "text" ? String(parsed.data) : null,
        valueJson: def.answerKind === "json" ? parsed.data : null,
      });
    }

    return this.db.transaction(async (tx) => {
      const [response] = await tx.insert(responsesTable).values({ formId: form.id }).returning();
      if (!response) throw new Error("FormService.submit: response insert returned nothing");

      if (rowsToInsert.length > 0) {
        await tx.insert(responseAnswersTable).values(
          rowsToInsert.map((r) => ({
            responseId: response.id,
            formFieldId: r.formFieldId,
            valueText: r.valueText,
            valueJson: r.valueJson,
          })),
        );
      }

      logger.info("response submitted", {
        responseId: response.id,
        formId: form.id,
        answerCount: rowsToInsert.length,
      });
      return { responseId: response.id };
    });
  }

  /** Load sections + fields + options for a form and stitch into a tree. */
  private async attachSchema(form: Form): Promise<FormWithSchema> {
    const sections = await this.db
      .select()
      .from(formSectionsTable)
      .where(and(eq(formSectionsTable.formId, form.id), notDeleted(formSectionsTable.deletedAt)))
      .orderBy(formSectionsTable.order);
    const sectionIds = sections.map((s) => s.id);

    const fields =
      sectionIds.length === 0
        ? []
        : await this.db
            .select()
            .from(formFieldsTable)
            .where(
              and(
                inArray(formFieldsTable.sectionId, sectionIds),
                notDeleted(formFieldsTable.deletedAt),
              ),
            )
            .orderBy(formFieldsTable.order);
    const fieldIds = fields.map((f) => f.id);

    const options =
      fieldIds.length === 0
        ? []
        : await this.db
            .select()
            .from(fieldOptionsTable)
            .where(
              and(
                inArray(fieldOptionsTable.fieldId, fieldIds),
                notDeleted(fieldOptionsTable.deletedAt),
              ),
            )
            .orderBy(fieldOptionsTable.order);

    const optionsByField = new Map<string, FieldOption[]>();
    for (const o of options) {
      const list = optionsByField.get(o.fieldId) ?? [];
      list.push(o);
      optionsByField.set(o.fieldId, list);
    }

    const fieldsBySection = new Map<string, Array<FormField & { options: FieldOption[] }>>();
    for (const f of fields) {
      const enriched = { ...f, options: optionsByField.get(f.id) ?? [] };
      const list = fieldsBySection.get(f.sectionId) ?? [];
      list.push(enriched);
      fieldsBySection.set(f.sectionId, list);
    }

    return {
      ...form,
      sections: sections.map((s) => ({
        ...s,
        fields: fieldsBySection.get(s.id) ?? [],
      })),
    };
  }
}
