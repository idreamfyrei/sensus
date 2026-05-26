import { TRPCError } from "@trpc/server";
import { eq, themesTable, DEFAULT_THEME_KEY } from "@repo/database";
import type { Context } from "../../context";

/**
 * Creator-scoped form operations. Every method takes a Context that has
 * already passed through `authMiddleware`, so `ctx.userId` is guaranteed
 * to be a string here.
 */
type ProtectedContext = Context & { userId: string };

export type CreateFormInput = {
  title: string;
  description?: string | null;
  /**
   * Optional — when omitted, the controller looks up the seeded `default`
   * theme. Phase 4 will add a theme-picker UI and make this mandatory.
   */
  themeId?: string;
};

export type GetFormInput = { id: string };
export type PublishFormInput = { id: string; version: number };
export type SetThemeInput = { id: string; themeId: string; version: number };

export class FormsController {
  /** Resolve a themeId — either the one the client provided, or the
   *  seeded default. Throws if no default exists (db:seed-dev wasn't run). */
  private async resolveThemeId(ctx: ProtectedContext, themeId?: string): Promise<string> {
    if (themeId) return themeId;

    // themesTable has no deletedAt — themes are seeded and immutable in Phase 2.
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
}
