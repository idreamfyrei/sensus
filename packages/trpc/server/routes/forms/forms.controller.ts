import { TRPCError } from "@trpc/server";
import { eq, themesTable, DEFAULT_THEME_KEY } from "@repo/database";
import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export type CreateFormInput = {
  title: string;
  description?: string | null;
  themeId?: string;
};

export type GetFormInput = { id: string };
export type PublishFormInput = { id: string; version: number };
export type SetThemeInput = { id: string; themeId: string; version: number };
export type SetLayoutInput = {
  id: string;
  layout: "one_per_screen" | "single_page";
  version: number;
};
export type SetVisibilityInput = {
  id: string;
  visibility: "public" | "unlisted";
  version: number;
};
export type UnpublishInput = { id: string; version: number };
export type SoftDeleteInput = { id: string };
export type SetTemplateInput = { id: string; isTemplate: boolean };
export type CloneTemplateInput = { templateId: string };

export class FormsController {
  private async resolveThemeId(ctx: ProtectedContext, themeId?: string): Promise<string> {
    if (themeId) return themeId;

    const [theme] = await ctx.db
      .select({ id: themesTable.id })
      .from(themesTable)
      .where(eq(themesTable.key, DEFAULT_THEME_KEY));

    if (!theme) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Default theme is missing — run `pnpm db:seed-dev` to seed it before creating forms.",
      });
    }
    return theme.id;
  }

  async create(ctx: ProtectedContext, input: CreateFormInput) {
    const themeId = await this.resolveThemeId(ctx, input.themeId);
    return ctx.services.forms.create({
      userId: ctx.userId,
      input: {
        title: input.title,
        description: input.description ?? null,
        themeId,
      },
    });
  }

  async get(ctx: ProtectedContext, input: GetFormInput) {
    return ctx.services.forms.getByIdWithSchema({ id: input.id, userId: ctx.userId });
  }

  async list(ctx: ProtectedContext) {
    return ctx.services.forms.listByUser({ userId: ctx.userId });
  }

  async publish(ctx: ProtectedContext, input: PublishFormInput) {
    return ctx.services.forms.publish({
      id: input.id,
      userId: ctx.userId,
      version: input.version,
    });
  }

  async setTheme(ctx: ProtectedContext, input: SetThemeInput) {
    return ctx.services.forms.setTheme({
      id: input.id,
      userId: ctx.userId,
      themeId: input.themeId,
      version: input.version,
    });
  }

  async setLayout(ctx: ProtectedContext, input: SetLayoutInput) {
    return ctx.services.forms.setLayout({
      id: input.id,
      userId: ctx.userId,
      layout: input.layout,
      version: input.version,
    });
  }

  async setVisibility(ctx: ProtectedContext, input: SetVisibilityInput) {
    return ctx.services.forms.setVisibility({
      id: input.id,
      userId: ctx.userId,
      visibility: input.visibility,
      version: input.version,
    });
  }

  async unpublish(ctx: ProtectedContext, input: UnpublishInput) {
    return ctx.services.forms.unpublish({
      id: input.id,
      userId: ctx.userId,
      version: input.version,
    });
  }

  async softDelete(ctx: ProtectedContext, input: SoftDeleteInput): Promise<{ ok: true }> {
    await ctx.services.forms.softDelete({ id: input.id, userId: ctx.userId });
    return { ok: true };
  }

  async setTemplate(ctx: ProtectedContext, input: SetTemplateInput) {
    return ctx.services.forms.setTemplate({
      id: input.id,
      userId: ctx.userId,
      isTemplate: input.isTemplate,
    });
  }

  async cloneTemplate(ctx: ProtectedContext, input: CloneTemplateInput) {
    return ctx.services.forms.cloneTemplate({
      templateId: input.templateId,
      userId: ctx.userId,
    });
  }

  async listPublic(ctx: Context) {
    void ctx;
    return ctx.services.forms.listPublic();
  }

  async listTemplates(ctx: Context) {
    void ctx;
    return ctx.services.forms.listTemplates();
  }
}
