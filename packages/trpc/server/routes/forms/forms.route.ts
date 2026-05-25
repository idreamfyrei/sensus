import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { FormsController } from "./forms.controller";

// Wire shapes are inlined here rather than imported from @repo/schemas to
// sidestep the drizzle-zod cross-workspace type-identity quirk we hit in
// Phase 2.2. Phase 4 will revisit this and align with @repo/schemas.
const createFormInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  themeId: z.string().uuid(),
});

const publishFormInput = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
});

const controller = new FormsController();

export const formsRouter = router({
  /** Creator: list every active form I own. */
  list: protectedProcedure.query(({ ctx }) => controller.list(ctx)),

  /** Creator: create a new draft form. */
  create: protectedProcedure
    .input(createFormInput)
    .mutation(({ ctx, input }) => controller.create(ctx, input)),

  /** Creator: flip a draft to published (optimistic-concurrency on version). */
  publish: protectedProcedure
    .input(publishFormInput)
    .mutation(({ ctx, input }) => controller.publish(ctx, input)),
});
