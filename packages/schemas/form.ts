import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { formsTable } from "@repo/database";
import { z } from "zod";

export const formSchema = createSelectSchema(formsTable);

export const createFormInput = createInsertSchema(formsTable, {
  title: z.string().min(1).max(200),
}).pick({
  title: true,
  description: true,
  themeId: true,
  visibility: true,
  layout: true,
});

export const updateFormInput = createInsertSchema(formsTable, {
  title: z.string().min(1).max(200),
})
  .pick({
    title: true,
    description: true,
    themeId: true,
    visibility: true,
    layout: true,
    passwordHash: true,
    expiresAt: true,
    maxResponses: true,
    isTemplate: true,
    oneResponsePerEmail: true,
  })
  .partial()
  .extend({
    id: z.string().uuid(),
    version: z.number().int(),
  });

// Slug edits are gated to draft-only (enforced server-side); this schema
// just validates the wire shape.
export const setFormSlugInput = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  slug: z
    .string()
    .min(1)
    .max(280)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
});

export const changeFormStatusInput = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(["draft", "published", "unpublished", "archived"]),
});

export type Form = z.infer<typeof formSchema>;
export type CreateFormInput = z.infer<typeof createFormInput>;
export type UpdateFormInput = z.infer<typeof updateFormInput>;
export type SetFormSlugInput = z.infer<typeof setFormSlugInput>;
export type ChangeFormStatusInput = z.infer<typeof changeFormStatusInput>;
