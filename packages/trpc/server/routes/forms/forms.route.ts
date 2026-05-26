import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { FormsController } from "./forms.controller";

const createFormInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  themeId: z.string().uuid().optional(), // server fills with default when omitted
});

const getFormInput = z.object({
  id: z.string().uuid(),
});

const publishFormInput = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
});

const setThemeInput = z.object({
  id: z.string().uuid(),
  themeId: z.string().uuid(),
  version: z.number().int(),
});

const setLayoutInput = z.object({
  id: z.string().uuid(),
  layout: z.enum(["one_per_screen", "single_page"]),
  version: z.number().int(),
});

const setVisibilityInput = z.object({
  id: z.string().uuid(),
  visibility: z.enum(["public", "unlisted"]),
  version: z.number().int(),
});

const unpublishInput = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
});

const softDeleteInput = z.object({ id: z.string().uuid() });

const setTemplateInput = z.object({
  id: z.string().uuid(),
  isTemplate: z.boolean(),
});

const cloneTemplateInput = z.object({
  templateId: z.string().uuid(),
});

const controller = new FormsController();

export const formsRouter = router({
  list: protectedProcedure.query(({ ctx }) => controller.list(ctx)),

  get: protectedProcedure.input(getFormInput).query(({ ctx, input }) => controller.get(ctx, input)),

  create: protectedProcedure
    .input(createFormInput)
    .mutation(({ ctx, input }) => controller.create(ctx, input)),

  publish: protectedProcedure
    .input(publishFormInput)
    .mutation(({ ctx, input }) => controller.publish(ctx, input)),

  setTheme: protectedProcedure
    .input(setThemeInput)
    .mutation(({ ctx, input }) => controller.setTheme(ctx, input)),

  setLayout: protectedProcedure
    .input(setLayoutInput)
    .mutation(({ ctx, input }) => controller.setLayout(ctx, input)),

  setVisibility: protectedProcedure
    .input(setVisibilityInput)
    .mutation(({ ctx, input }) => controller.setVisibility(ctx, input)),

  unpublish: protectedProcedure
    .input(unpublishInput)
    .mutation(({ ctx, input }) => controller.unpublish(ctx, input)),

  softDelete: protectedProcedure
    .input(softDeleteInput)
    .mutation(({ ctx, input }) => controller.softDelete(ctx, input)),

  setTemplate: protectedProcedure
    .input(setTemplateInput)
    .mutation(({ ctx, input }) => controller.setTemplate(ctx, input)),

  cloneTemplate: protectedProcedure
    .input(cloneTemplateInput)
    .mutation(({ ctx, input }) => controller.cloneTemplate(ctx, input)),

  listPublic: publicProcedure.query(({ ctx }) => controller.listPublic(ctx)),
  listTemplates: publicProcedure.query(({ ctx }) => controller.listTemplates(ctx)),
});
