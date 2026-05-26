import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export class AccountController {
  async deleteSelf(ctx: ProtectedContext): Promise<{ ok: true }> {
    await ctx.services.account.deleteSelf({ userId: ctx.userId });
    return { ok: true };
  }
}
