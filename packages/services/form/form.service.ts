import {
  and,
  eq,
  formsTable,
  responsesTable,
  responseAnswersTable,
  notDeleted,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";
import { generateSlug } from "./slug";

// Drizzle's native inferred select — avoids drizzle-zod 0.7 enum-pollution.
type Form = typeof formsTable.$inferSelect;

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

export class FormService {
  constructor(private readonly db: Database) {}

  async create(args: { userId: string; input: CreateFormServiceInput }): Promise<Form> {
    const slug = generateSlug(args.input.title);

    const newForm: typeof formsTable.$inferInsert = {
      userId: args.userId,
      title: args.input.title,
      description: args.input.description ?? null,
      themeId: args.input.themeId,
      slug,
    };

    const [row] = await this.db.insert(formsTable).values(newForm).returning();

    if (!row) throw new Error("FormService.create: insert returned nothing");
    logger.info("form created", { id: row.id, userId: args.userId, slug });
    return row;
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

  async listByUser(args: { userId: string }): Promise<Form[]> {
    return this.db
      .select()
      .from(formsTable)
      .where(and(eq(formsTable.userId, args.userId), notDeleted(formsTable.deletedAt)));
  }

  async publish(args: { id: string; userId: string; version: number }): Promise<Form> {
    const existing = await this.getById({ id: args.id, userId: args.userId });
    if (existing.version !== args.version) {
      throw new FormVersionMismatchError();
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

  async submit(args: {
    slug: string;
    answers: ReadonlyArray<{ fieldId: string; value: string }>;
  }): Promise<{ responseId: string }> {
    const form = await this.getBySlug({ slug: args.slug });
    if (form.status !== "published") {
      throw new FormNotPublishedError();
    }

    return this.db.transaction(async (tx) => {
      const [response] = await tx.insert(responsesTable).values({ formId: form.id }).returning();
      if (!response) throw new Error("FormService.submit: response insert returned nothing");

      if (args.answers.length > 0) {
        await tx.insert(responseAnswersTable).values(
          args.answers.map((a) => ({
            responseId: response.id,
            formFieldId: a.fieldId,
            valueText: a.value,
            valueJson: null,
          })),
        );
      }

      logger.info("response submitted", {
        responseId: response.id,
        formId: form.id,
        answerCount: args.answers.length,
      });
      return { responseId: response.id };
    });
  }
}
