import type { Context } from "../../context";

export type GetBySlugInput = { slug: string };

export type SubmitInput = {
  slug: string;
  answers: ReadonlyArray<{ fieldId: string; value: unknown }>;
};

export class PublicFormController {
  async getBySlug(ctx: Context, input: GetBySlugInput) {
    return ctx.services.forms.getBySlugWithSchema({ slug: input.slug });
  }

  async submit(ctx: Context, input: SubmitInput) {
    return ctx.services.forms.submit({ slug: input.slug, answers: input.answers });
  }
}
