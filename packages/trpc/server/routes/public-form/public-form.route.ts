import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { PublicFormController } from "./public-form.controller";

const getBySlugInput = z.object({
  slug: z.string().min(1).max(280),
});

const submitInput = z.object({
  slug: z.string().min(1).max(280),
  // Value is typed loosely on the wire; server re-validates each answer
  // against the field's catalog-built schema before insert.
  answers: z.array(
    z.object({
      fieldId: z.string().uuid(),
      value: z.unknown(),
    }),
  ),
});

const controller = new PublicFormController();

export const publicFormRouter = router({
  /** Anonymous: load a form by its public slug. */
  getBySlug: publicProcedure
    .input(getBySlugInput)
    .query(({ ctx, input }) => controller.getBySlug(ctx, input)),

  /** Anonymous: submit a response. Phase 2 supports short_text answers. */
  submit: publicProcedure
    .input(submitInput)
    .mutation(({ ctx, input }) => controller.submit(ctx, input)),
});
