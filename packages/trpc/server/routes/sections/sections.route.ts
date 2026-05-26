import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { SectionsController } from "./sections.controller";

const addInput = z.object({ formId: z.string().uuid() });

const updateInput = z.object({
  sectionId: z.string().uuid(),
  patch: z
    .object({
      title: z.string().max(200).nullable().optional(),
      description: z.string().max(2000).nullable().optional(),
      pageBreakBefore: z.boolean().optional(),
      showIntroScreen: z.boolean().optional(),
    })
    .strict(),
});

const deleteInput = z.object({ sectionId: z.string().uuid() });

const reorderInput = z.object({
  formId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()),
});

const controller = new SectionsController();

export const sectionsRouter = router({
  add: protectedProcedure.input(addInput).mutation(({ ctx, input }) => controller.add(ctx, input)),

  update: protectedProcedure
    .input(updateInput)
    .mutation(({ ctx, input }) => controller.update(ctx, input)),

  delete: protectedProcedure
    .input(deleteInput)
    .mutation(({ ctx, input }) => controller.delete(ctx, input)),

  reorder: protectedProcedure
    .input(reorderInput)
    .mutation(({ ctx, input }) => controller.reorder(ctx, input)),
});
