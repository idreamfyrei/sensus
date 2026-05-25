import type { Context } from "../../context";

/**
 * Public-facing form operations. No authentication; respondents are
 * always anonymous in Phase 2. Visibility / expiry / invite-token checks
 * land in later phases — see the publicForm.getBySlug spec in CONTEXT.md.
 */

export type GetBySlugInput = { slug: string };

export type SubmitInput = {
  slug: string;
  answers: ReadonlyArray<{ fieldId: string; value: string }>;
};

export class PublicFormController {
  async getBySlug(ctx: Context, input: GetBySlugInput) {
    return ctx.services.forms.getBySlug({ slug: input.slug });
  }

  async submit(ctx: Context, input: SubmitInput) {
    return ctx.services.forms.submit({ slug: input.slug, answers: input.answers });
  }
}
