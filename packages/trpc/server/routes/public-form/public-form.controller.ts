import { FormArchivedError, FormNotPublishedError, RateLimitExceededError } from "@repo/services";
import type { Context } from "../../context";

export type GetBySlugInput = { slug: string };

export type SubmitInput = {
  slug: string;
  answers: ReadonlyArray<{ fieldId: string; value: unknown }>;
  honeypot?: string;
};

const PER_FORM_PER_IP_LIMIT = 5;
const GLOBAL_PER_IP_LIMIT = 30;
const WINDOW_SECONDS = 60;

export class PublicFormController {
  async getBySlug(ctx: Context, input: GetBySlugInput) {
    const result = await ctx.services.forms.getBySlugWithSchema({ slug: input.slug });
    if (result.status === "archived") throw new FormArchivedError();
    if (result.status !== "published") throw new FormNotPublishedError();
    try {
      await ctx.services.forms.recordView({
        slug: input.slug,
        ipHash: ctx.ipHash,
      });
    } catch (err) {
      console.warn("recordView failed", (err as Error).message);
    }
    return result;
  }

  async submit(ctx: Context, input: SubmitInput) {
    if (input.honeypot && input.honeypot.trim() !== "") {
      console.warn("honeypot triggered, silently dropping submission", {
        slug: input.slug,
        ipHash: ctx.ipHash,
      });
      return { responseId: "honeypot-dropped" };
    }

    const ipKey = ctx.ipHash ?? "anonymous";
    const perFormCheck = await ctx.services.rateLimit.check({
      key: `submit:${input.slug}:${ipKey}`,
      limit: PER_FORM_PER_IP_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    });
    if (!perFormCheck.ok) {
      throw new RateLimitExceededError(Math.ceil((perFormCheck.resetAt - Date.now()) / 1000));
    }
    const globalCheck = await ctx.services.rateLimit.check({
      key: `submit:global:${ipKey}`,
      limit: GLOBAL_PER_IP_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    });
    if (!globalCheck.ok) {
      throw new RateLimitExceededError(Math.ceil((globalCheck.resetAt - Date.now()) / 1000));
    }

    return ctx.services.forms.submit({ slug: input.slug, answers: input.answers });
  }
}
