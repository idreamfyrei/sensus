import {
  and,
  eq,
  inArray,
  fieldConditionsTable,
  fieldOptionsTable,
  formFieldsTable,
  formSectionsTable,
  formViewsTable,
  formsTable,
  responsesTable,
  responseAnswersTable,
  themesTable,
  user,
  notDeleted,
  type Database,
} from "@repo/database";
import { EmailService } from "@repo/email";
import { logger } from "@repo/logger";
import { FIELD_TYPES_CATALOG, getFieldTypeDef } from "@repo/schemas";
import { evaluateConditions } from "../condition/evaluator";
import { generateSlug } from "./slug";

type Form = typeof formsTable.$inferSelect;
type FormSection = typeof formSectionsTable.$inferSelect;
type FormField = typeof formFieldsTable.$inferSelect;
type FieldOption = typeof fieldOptionsTable.$inferSelect;
type FieldCondition = typeof fieldConditionsTable.$inferSelect;
type Theme = typeof themesTable.$inferSelect;

export type FormWithSchema = Form & {
  theme: Theme;
  conditions: FieldCondition[];
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

export class FormArchivedError extends Error {
  readonly code = "FORM_ARCHIVED" as const;
  constructor() {
    super("This form has been archived");
    this.name = "FormArchivedError";
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

export class FormSchemaLockedError extends Error {
  readonly code = "FORM_SCHEMA_LOCKED" as const;
  constructor() {
    super("Form schema is locked — only draft forms can be edited");
    this.name = "FormSchemaLockedError";
  }
}

export class ThemeNotFoundForFormError extends Error {
  readonly code = "THEME_NOT_FOUND" as const;
  constructor() {
    super("Theme not found");
    this.name = "ThemeNotFoundForFormError";
  }
}

export class FormService {
  private readonly db: Database;
  private readonly emailService: EmailService;

  constructor(db: Database, emailService?: EmailService) {
    this.db = db;
    this.emailService =
      emailService ??
      new EmailService({
        apiKey: process.env.RESEND_API_KEY,
        from: process.env.RESEND_FROM,
        logger,
      });
  }

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

  async unpublish(args: { id: string; userId: string; version: number }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.version !== args.version) throw new FormVersionMismatchError();
    if (existing.status !== "published") throw new FormNotPublishedError();

    const [updated] = await this.db
      .update(formsTable)
      .set({ status: "unpublished", version: existing.version + 1 })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.unpublish: update returned nothing");
    logger.info("form unpublished", { id: updated.id, userId: args.userId });
    return updated;
  }

  async setVisibility(args: {
    id: string;
    userId: string;
    visibility: "public" | "unlisted";
    version: number;
  }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.version !== args.version) throw new FormVersionMismatchError();

    const [updated] = await this.db
      .update(formsTable)
      .set({ visibility: args.visibility, version: existing.version + 1 })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.setVisibility: update returned nothing");
    logger.info("form visibility changed", {
      id: updated.id,
      userId: args.userId,
      visibility: args.visibility,
    });
    return updated;
  }

  async softDelete(args: { id: string; userId: string }): Promise<void> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    await this.db
      .update(formsTable)
      .set({ deletedAt: new Date() })
      .where(eq(formsTable.id, existing.id));
    logger.info("form soft-deleted", { id: existing.id, userId: args.userId });
  }

  async listPublic(args?: { limit?: number }): Promise<Array<Form & { theme: Theme }>> {
    const limit = args?.limit ?? 100;
    const rows = await this.db
      .select()
      .from(formsTable)
      .where(
        and(
          eq(formsTable.visibility, "public"),
          eq(formsTable.status, "published"),
          notDeleted(formsTable.deletedAt),
        ),
      )
      .limit(limit);
    return this.attachThemes(rows);
  }

  async listTemplates(args?: { limit?: number }): Promise<Array<Form & { theme: Theme }>> {
    const limit = args?.limit ?? 100;
    const rows = await this.db
      .select()
      .from(formsTable)
      .where(
        and(
          eq(formsTable.isTemplate, true),
          eq(formsTable.visibility, "public"),
          eq(formsTable.status, "published"),
          notDeleted(formsTable.deletedAt),
        ),
      )
      .limit(limit);
    return this.attachThemes(rows);
  }

  async setTemplate(args: { id: string; userId: string; isTemplate: boolean }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (args.isTemplate && existing.visibility !== "public") {
      throw new Error("Only public forms can be flagged as templates");
    }
    const [updated] = await this.db
      .update(formsTable)
      .set({ isTemplate: args.isTemplate })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.setTemplate: update returned nothing");
    logger.info("form template flag changed", {
      id: updated.id,
      userId: args.userId,
      isTemplate: args.isTemplate,
    });
    return updated;
  }

  async cloneTemplate(args: { templateId: string; userId: string }): Promise<Form> {
    const [template] = await this.db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.id, args.templateId), notDeleted(formsTable.deletedAt)));
    if (!template) throw new FormNotFoundError();
    if (!template.isTemplate || template.status !== "published") {
      throw new FormNotFoundError();
    }

    const newSlug = generateSlug(template.title);

    return this.db.transaction(async (tx) => {
      const [newForm] = await tx
        .insert(formsTable)
        .values({
          userId: args.userId,
          title: template.title,
          description: template.description,
          themeId: template.themeId,
          layout: template.layout,
          visibility: "public",
          slug: newSlug,
          status: "draft",
          isTemplate: false,
        })
        .returning();
      if (!newForm) throw new Error("cloneTemplate: insert returned nothing");

      const oldSections = await tx
        .select()
        .from(formSectionsTable)
        .where(
          and(eq(formSectionsTable.formId, template.id), notDeleted(formSectionsTable.deletedAt)),
        )
        .orderBy(formSectionsTable.order);

      const sectionIdMap = new Map<string, string>();
      const fieldIdMap = new Map<string, string>();

      for (const s of oldSections) {
        const [insertedSection] = await tx
          .insert(formSectionsTable)
          .values({
            formId: newForm.id,
            order: s.order,
            title: s.title,
            description: s.description,
            pageBreakBefore: s.pageBreakBefore,
            showIntroScreen: s.showIntroScreen,
          })
          .returning();
        if (!insertedSection) throw new Error("cloneTemplate: section insert returned nothing");
        sectionIdMap.set(s.id, insertedSection.id);
      }

      if (oldSections.length === 0) {
        await tx.insert(formSectionsTable).values({ formId: newForm.id, order: 0 });
      }

      const oldSectionIds = oldSections.map((s) => s.id);
      const oldFields =
        oldSectionIds.length === 0
          ? []
          : await tx
              .select()
              .from(formFieldsTable)
              .where(
                and(
                  inArray(formFieldsTable.sectionId, oldSectionIds),
                  notDeleted(formFieldsTable.deletedAt),
                ),
              )
              .orderBy(formFieldsTable.order);

      for (const f of oldFields) {
        const newSectionId = sectionIdMap.get(f.sectionId);
        if (!newSectionId) continue;
        const [insertedField] = await tx
          .insert(formFieldsTable)
          .values({
            formId: newForm.id,
            sectionId: newSectionId,
            type: f.type,
            label: f.label,
            description: f.description,
            placeholder: f.placeholder,
            order: f.order,
            required: f.required,
            minLength: f.minLength,
            maxLength: f.maxLength,
            min: f.min,
            max: f.max,
            pattern: f.pattern,
            isInteger: f.isInteger,
            includeTime: f.includeTime,
            maxRating: f.maxRating,
            minSelected: f.minSelected,
            maxSelected: f.maxSelected,
          })
          .returning();
        if (!insertedField) continue;
        fieldIdMap.set(f.id, insertedField.id);
      }

      const oldFieldIds = oldFields.map((f) => f.id);
      const oldOptions =
        oldFieldIds.length === 0
          ? []
          : await tx
              .select()
              .from(fieldOptionsTable)
              .where(
                and(
                  inArray(fieldOptionsTable.fieldId, oldFieldIds),
                  notDeleted(fieldOptionsTable.deletedAt),
                ),
              );
      if (oldOptions.length > 0) {
        await tx.insert(fieldOptionsTable).values(
          oldOptions
            .map((o) => {
              const newFieldId = fieldIdMap.get(o.fieldId);
              if (!newFieldId) return null;
              return {
                fieldId: newFieldId,
                label: o.label,
                value: o.value,
                order: o.order,
              };
            })
            .filter((v): v is NonNullable<typeof v> => v !== null),
        );
      }

      const oldConditions = await tx
        .select()
        .from(fieldConditionsTable)
        .where(
          and(
            eq(fieldConditionsTable.formId, template.id),
            notDeleted(fieldConditionsTable.deletedAt),
          ),
        );
      if (oldConditions.length > 0) {
        const toInsert = oldConditions
          .map((c) => {
            const newSource = fieldIdMap.get(c.sourceFieldId);
            if (!newSource) return null;
            const newTargetField = c.targetFieldId ? fieldIdMap.get(c.targetFieldId) : null;
            const newTargetSection = c.targetSectionId ? sectionIdMap.get(c.targetSectionId) : null;
            if (!newTargetField && !newTargetSection) return null;
            return {
              formId: newForm.id,
              sourceFieldId: newSource,
              operator: c.operator,
              value: c.value,
              action: c.action,
              targetFieldId: newTargetField ?? null,
              targetSectionId: newTargetSection ?? null,
            };
          })
          .filter((v): v is NonNullable<typeof v> => v !== null);
        if (toInsert.length > 0) {
          await tx.insert(fieldConditionsTable).values(toInsert);
        }
      }

      logger.info("template cloned", {
        templateId: template.id,
        newFormId: newForm.id,
        userId: args.userId,
      });
      return newForm;
    });
  }

  private async attachThemes(rows: Form[]): Promise<Array<Form & { theme: Theme }>> {
    if (rows.length === 0) return [];
    const themeIds = Array.from(new Set(rows.map((r) => r.themeId)));
    const themes = await this.db
      .select()
      .from(themesTable)
      .where(inArray(themesTable.id, themeIds));
    const byId = new Map(themes.map((t) => [t.id, t]));
    return rows
      .map((r) => {
        const theme = byId.get(r.themeId);
        if (!theme) return null;
        return { ...r, theme };
      })
      .filter((v): v is Form & { theme: Theme } => v !== null);
  }

  async setLayout(args: {
    id: string;
    userId: string;
    layout: "one_per_screen" | "single_page";
    version: number;
  }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.status !== "draft") throw new FormSchemaLockedError();
    if (existing.version !== args.version) throw new FormVersionMismatchError();

    const [updated] = await this.db
      .update(formsTable)
      .set({ layout: args.layout, version: existing.version + 1 })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.setLayout: update returned nothing");
    logger.info("form layout changed", {
      id: updated.id,
      userId: args.userId,
      layout: args.layout,
    });
    return updated;
  }

  async setTheme(args: {
    id: string;
    userId: string;
    themeId: string;
    version: number;
  }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.status !== "draft") throw new FormSchemaLockedError();
    if (existing.version !== args.version) throw new FormVersionMismatchError();

    const [theme] = await this.db
      .select({ id: themesTable.id })
      .from(themesTable)
      .where(eq(themesTable.id, args.themeId));
    if (!theme) throw new ThemeNotFoundForFormError();

    const [updated] = await this.db
      .update(formsTable)
      .set({ themeId: args.themeId, version: existing.version + 1 })
      .where(eq(formsTable.id, args.id))
      .returning();
    if (!updated) throw new Error("FormService.setTheme: update returned nothing");
    logger.info("form theme changed", {
      id: updated.id,
      userId: args.userId,
      themeId: args.themeId,
    });
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

  async recordView(args: { slug: string; ipHash?: string | null }): Promise<void> {
    const [form] = await this.db
      .select({ id: formsTable.id, status: formsTable.status })
      .from(formsTable)
      .where(and(eq(formsTable.slug, args.slug), notDeleted(formsTable.deletedAt)));
    if (!form || form.status !== "published") return;
    await this.db.insert(formViewsTable).values({ formId: form.id, ipHash: args.ipHash ?? null });
  }

  async submit(args: {
    slug: string;
    answers: ReadonlyArray<{ fieldId: string; value: unknown }>;
  }): Promise<{ responseId: string }> {
    const form = await this.getBySlugWithSchema({ slug: args.slug });
    if (form.status !== "published") throw new FormNotPublishedError();

    const fieldsById = new Map<
      string,
      {
        type: keyof typeof FIELD_TYPES_CATALOG;
        field: (typeof form.sections)[number]["fields"][number];
        sectionId: string;
      }
    >();
    for (const section of form.sections) {
      for (const f of section.fields) {
        fieldsById.set(f.id, { type: f.type, field: f, sectionId: section.id });
      }
    }

    const answersByFieldId: Record<string, unknown> = {};
    for (const a of args.answers) answersByFieldId[a.fieldId] = a.value;

    const evaluation = evaluateConditions({
      conditions: form.conditions,
      answers: answersByFieldId,
    });

    const isEmpty = (v: unknown): boolean => {
      if (v === undefined || v === null) return true;
      if (typeof v === "string" && v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    };

    const rowsToInsert: Array<{
      formFieldId: string;
      valueText: string | null;
      valueJson: unknown | null;
    }> = [];
    const parsedAnswerByFieldId = new Map<string, unknown>();

    for (const [fieldId, { field, sectionId }] of fieldsById) {
      if (evaluation.hiddenFieldIds.has(fieldId)) continue;
      if (evaluation.hiddenSectionIds.has(sectionId)) continue;

      const def = getFieldTypeDef(field.type);
      const optionValues = field.options.map((o) => o.value);
      const raw = answersByFieldId[fieldId];

      const dynamicallyRequired = evaluation.requiredFieldIds.has(fieldId);
      if (dynamicallyRequired && isEmpty(raw)) {
        throw new InvalidAnswerError(fieldId, "This field is required");
      }

      const schema = def.buildAnswerSchema(field, optionValues);
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        throw new InvalidAnswerError(fieldId, parsed.error.issues[0]?.message ?? "Invalid value");
      }

      if (parsed.data === undefined || parsed.data === "" || parsed.data === null) {
        continue;
      }

      parsedAnswerByFieldId.set(fieldId, parsed.data);

      rowsToInsert.push({
        formFieldId: fieldId,
        valueText: def.answerKind === "text" ? String(parsed.data) : null,
        valueJson: def.answerKind === "json" ? parsed.data : null,
      });
    }

    const submission = await this.db.transaction(async (tx) => {
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
      return {
        responseId: response.id,
        submittedAt: response.submittedAt,
      };
    });

    const [creator] = await this.db
      .select({ email: user.email })
      .from(user)
      .where(and(eq(user.id, form.userId), notDeleted(user.deletedAt)))
      .limit(1);

    let respondentEmail: string | null = null;
    for (const [fieldId, parsedValue] of parsedAnswerByFieldId) {
      const meta = fieldsById.get(fieldId);
      if (!meta || meta.type !== "email") continue;
      if (typeof parsedValue === "string" && parsedValue.trim()) {
        respondentEmail = parsedValue.trim().toLowerCase();
        break;
      }
    }

    const emailTasks: Promise<void>[] = [];
    if (creator?.email) {
      emailTasks.push(
        this.emailService.sendNewResponse({
          to: creator.email,
          formTitle: form.title,
          formSlug: form.slug,
          responseId: submission.responseId,
          submittedAt: submission.submittedAt,
          answerCount: rowsToInsert.length,
        }),
      );
    }
    if (respondentEmail) {
      emailTasks.push(
        this.emailService.sendRespondentThankYou({
          to: respondentEmail,
          formTitle: form.title,
          formSlug: form.slug,
        }),
      );
    }
    if (emailTasks.length > 0) {
      void Promise.all(emailTasks).catch((error) => {
        logger.error("email dispatch failed after response submission", {
          responseId: submission.responseId,
          formId: form.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    return { responseId: submission.responseId };
  }

  private async attachSchema(form: Form): Promise<FormWithSchema> {
    const [theme] = await this.db
      .select()
      .from(themesTable)
      .where(eq(themesTable.id, form.themeId));
    if (!theme) throw new Error(`FormService.attachSchema: theme ${form.themeId} missing`);

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

    const conditions = await this.db
      .select()
      .from(fieldConditionsTable)
      .where(
        and(eq(fieldConditionsTable.formId, form.id), notDeleted(fieldConditionsTable.deletedAt)),
      );

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
      theme,
      conditions,
      sections: sections.map((s) => ({
        ...s,
        fields: fieldsBySection.get(s.id) ?? [],
      })),
    };
  }
}
