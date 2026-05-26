import {
  and,
  eq,
  formFieldsTable,
  formSectionsTable,
  formsTable,
  notDeleted,
  sql,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";
import { FormForbiddenError, FormNotFoundError, FormSchemaLockedError } from "../form/form.service";

type FormSection = typeof formSectionsTable.$inferSelect;

export class SectionNotFoundError extends Error {
  readonly code = "SECTION_NOT_FOUND" as const;
  constructor() {
    super("Section not found");
    this.name = "SectionNotFoundError";
  }
}

export class SectionHasFieldsError extends Error {
  readonly code = "SECTION_HAS_FIELDS" as const;
  constructor() {
    super("Move or delete the fields in this section before deleting it");
    this.name = "SectionHasFieldsError";
  }
}

export class LastSectionError extends Error {
  readonly code = "LAST_SECTION" as const;
  constructor() {
    super("A form must have at least one section");
    this.name = "LastSectionError";
  }
}

type SectionPatch = Partial<{
  title: string | null;
  description: string | null;
  pageBreakBefore: boolean;
  showIntroScreen: boolean;
}>;

export class SectionService {
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

  async listByForm(args: { formId: string }): Promise<FormSection[]> {
    return this.db
      .select()
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.formId, args.formId), notDeleted(formSectionsTable.deletedAt)),
      )
      .orderBy(formSectionsTable.order);
  }

  async addSection(args: { formId: string; userId: string }): Promise<FormSection> {
    await this.assertEditable({ formId: args.formId, userId: args.userId });

    const existing = await this.db
      .select({ order: formSectionsTable.order })
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.formId, args.formId), notDeleted(formSectionsTable.deletedAt)),
      );
    const nextOrder = existing.reduce((m, r) => Math.max(m, r.order), -1) + 1;

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(formSectionsTable)
        .values({ formId: args.formId, order: nextOrder })
        .returning();
      if (!row) throw new Error("SectionService.addSection: insert returned nothing");
      await this.bumpVersion(tx, args.formId);
      logger.info("section added", { sectionId: row.id, formId: args.formId });
      return row;
    });
  }

  async updateSection(args: {
    sectionId: string;
    userId: string;
    patch: SectionPatch;
  }): Promise<FormSection> {
    const [existing] = await this.db
      .select({ formId: formSectionsTable.formId })
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.id, args.sectionId), notDeleted(formSectionsTable.deletedAt)),
      );
    if (!existing) throw new SectionNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(formSectionsTable)
        .set(args.patch)
        .where(eq(formSectionsTable.id, args.sectionId))
        .returning();
      if (!row) throw new SectionNotFoundError();
      await this.bumpVersion(tx, existing.formId);
      return row;
    });
  }

  async deleteSection(args: { sectionId: string; userId: string }): Promise<void> {
    const [existing] = await this.db
      .select({ formId: formSectionsTable.formId })
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.id, args.sectionId), notDeleted(formSectionsTable.deletedAt)),
      );
    if (!existing) throw new SectionNotFoundError();
    await this.assertEditable({ formId: existing.formId, userId: args.userId });

    const [field] = await this.db
      .select({ id: formFieldsTable.id })
      .from(formFieldsTable)
      .where(
        and(eq(formFieldsTable.sectionId, args.sectionId), notDeleted(formFieldsTable.deletedAt)),
      )
      .limit(1);
    if (field) throw new SectionHasFieldsError();

    const liveSections = await this.db
      .select({ id: formSectionsTable.id })
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.formId, existing.formId), notDeleted(formSectionsTable.deletedAt)),
      );
    if (liveSections.length <= 1) throw new LastSectionError();

    await this.db.transaction(async (tx) => {
      await tx
        .update(formSectionsTable)
        .set({ deletedAt: new Date() })
        .where(eq(formSectionsTable.id, args.sectionId));
      await this.bumpVersion(tx, existing.formId);
      logger.info("section deleted", { sectionId: args.sectionId, formId: existing.formId });
    });
  }

  async reorderSections(args: {
    formId: string;
    userId: string;
    orderedIds: string[];
  }): Promise<void> {
    await this.assertEditable({ formId: args.formId, userId: args.userId });

    const live = await this.db
      .select({ id: formSectionsTable.id })
      .from(formSectionsTable)
      .where(
        and(eq(formSectionsTable.formId, args.formId), notDeleted(formSectionsTable.deletedAt)),
      );
    const liveIds = new Set(live.map((r) => r.id));
    for (const id of args.orderedIds) {
      if (!liveIds.has(id)) throw new SectionNotFoundError();
    }
    if (args.orderedIds.length !== liveIds.size) throw new SectionNotFoundError();

    await this.db.transaction(async (tx) => {
      for (let i = 0; i < args.orderedIds.length; i++) {
        const id = args.orderedIds[i];
        if (!id) continue;
        await tx
          .update(formSectionsTable)
          .set({ order: i })
          .where(and(eq(formSectionsTable.id, id), eq(formSectionsTable.formId, args.formId)));
      }
      await this.bumpVersion(tx, args.formId);
    });
  }
}
