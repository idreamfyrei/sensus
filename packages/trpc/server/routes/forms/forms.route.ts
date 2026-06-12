import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { FormsController } from "./forms.controller";

const createFormInput = z.object({
  title: z.string().min(1).max(200).describe("Form title"),
  description: z.string().max(2000).nullable().optional().describe("Optional description"),
  themeId: z.string().uuid().optional().describe("Theme id; defaults to the seeded default"),
});

const getFormInput = z.object({
  id: z.string().uuid().describe("Form id"),
});

const publishFormInput = z.object({
  id: z.string().uuid().describe("Form id"),
  version: z.number().int().describe("Optimistic concurrency version"),
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
  templateId: z.string().uuid().describe("Template form id to clone"),
});

const controller = new FormsController();

export const formsRouter = router({
  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms",
        tags: ["Forms"],
        summary: "List the calling user's forms",
        protect: true,
      },
    })
    .output(z.any())
    .query(({ ctx }) => controller.list(ctx)),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms/{id}",
        tags: ["Forms"],
        summary:
          "Get a single form with its full schema (sections, fields, options, conditions, theme)",
        protect: true,
      },
    })
    .input(getFormInput)
    .output(z.any())
    .query(({ ctx, input }) => controller.get(ctx, input)),

  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms",
        tags: ["Forms"],
        summary: "Create a new draft form",
        protect: true,
      },
    })
    .input(createFormInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.create(ctx, input)),

  publish: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms/{id}/publish",
        tags: ["Forms"],
        summary: "Publish a draft form so respondents can fill it",
        protect: true,
      },
    })
    .input(publishFormInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.publish(ctx, input)),

  setTheme: protectedProcedure
    .input(setThemeInput)
    .mutation(({ ctx, input }) => controller.setTheme(ctx, input)),

  setLayout: protectedProcedure
    .input(setLayoutInput)
    .mutation(({ ctx, input }) => controller.setLayout(ctx, input)),

  setVisibility: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms/{id}/visibility",
        tags: ["Forms"],
        summary: "Set form visibility (public or unlisted)",
        protect: true,
      },
    })
    .input(setVisibilityInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.setVisibility(ctx, input)),

  unpublish: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms/{id}/unpublish",
        tags: ["Forms"],
        summary: "Unpublish a published form",
        protect: true,
      },
    })
    .input(unpublishInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.unpublish(ctx, input)),

  softDelete: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/forms/{id}",
        tags: ["Forms"],
        summary: "Soft-delete a form (purged after 30 days)",
        protect: true,
      },
    })
    .input(softDeleteInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.softDelete(ctx, input)),

  setTemplate: protectedProcedure
    .input(setTemplateInput)
    .mutation(({ ctx, input }) => controller.setTemplate(ctx, input)),

  cloneTemplate: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/forms/clone-template",
        tags: ["Templates"],
        summary: "Clone a public template into a new draft form owned by the caller",
        protect: true,
      },
    })
    .input(cloneTemplateInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.cloneTemplate(ctx, input)),

  listPublic: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms/public",
        tags: ["Discovery"],
        summary: "List public, published forms (Explore page)",
      },
    })
    .output(z.any())
    .query(({ ctx }) => controller.listPublic(ctx)),

  listTemplates: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/forms/templates",
        tags: ["Discovery"],
        summary: "List public templates (Templates gallery)",
      },
    })
    .output(z.any())
    .query(({ ctx }) => controller.listTemplates(ctx)),
});
