import { z } from "zod";
import { publicProcedure, router } from "../../trpc";
import { PublicFormController } from "./public-form.controller";

const getBySlugInput = z.object({
  slug: z.string().min(1).max(280).describe("Public slug of the form"),
});

const submitInput = z.object({
  slug: z.string().min(1).max(280).describe("Public slug of the form"),
  answers: z
    .array(
      z.object({
        fieldId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .describe("One entry per answered field"),
  honeypot: z.string().max(500).optional().describe("Hidden spam-trap field; leave empty"),
});

const controller = new PublicFormController();

export const publicFormRouter = router({
  getBySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/public/forms/{slug}",
        tags: ["Public Form"],
        summary:
          "Fetch a published form by its public slug, including its theme, sections, fields, options, and conditional logic. Records a view.",
      },
    })
    .input(getBySlugInput)
    .output(z.any())
    .query(({ ctx, input }) => controller.getBySlug(ctx, input)),

  submit: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/public/forms/{slug}/submit",
        tags: ["Public Form"],
        summary:
          "Submit answers to a public form. Server re-validates against each field's schema, applies conditional logic, and rate-limits per IP.",
      },
    })
    .input(submitInput)
    .output(z.any())
    .mutation(({ ctx, input }) => controller.submit(ctx, input)),
});
