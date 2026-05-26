import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export type AddSectionInput = { formId: string };
export type UpdateSectionInput = {
  sectionId: string;
  patch: {
    title?: string | null;
    description?: string | null;
    pageBreakBefore?: boolean;
    showIntroScreen?: boolean;
  };
};
export type DeleteSectionInput = { sectionId: string };
export type ReorderSectionsInput = { formId: string; orderedIds: string[] };

export class SectionsController {
  async add(ctx: ProtectedContext, input: AddSectionInput) {
    return ctx.services.sections.addSection({ formId: input.formId, userId: ctx.userId });
  }

  async update(ctx: ProtectedContext, input: UpdateSectionInput) {
    return ctx.services.sections.updateSection({
      sectionId: input.sectionId,
      userId: ctx.userId,
      patch: input.patch,
    });
  }

  async delete(ctx: ProtectedContext, input: DeleteSectionInput): Promise<{ ok: true }> {
    await ctx.services.sections.deleteSection({
      sectionId: input.sectionId,
      userId: ctx.userId,
    });
    return { ok: true };
  }

  async reorder(ctx: ProtectedContext, input: ReorderSectionsInput): Promise<{ ok: true }> {
    await ctx.services.sections.reorderSections({
      formId: input.formId,
      userId: ctx.userId,
      orderedIds: input.orderedIds,
    });
    return { ok: true };
  }
}
