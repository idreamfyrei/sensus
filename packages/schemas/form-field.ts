import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { formFieldsTable } from "@repo/database";
import { z } from "zod";

export const formFieldSchema = createSelectSchema(formFieldsTable);

export const createFormFieldInput = createInsertSchema(formFieldsTable, {
  label: z.string().min(1).max(200),
}).pick({
  formId: true,
  sectionId: true,
  type: true,
  label: true,
  description: true,
  placeholder: true,
  order: true,
  required: true,
  minLength: true,
  maxLength: true,
  min: true,
  max: true,
  pattern: true,
  isInteger: true,
  includeTime: true,
  maxRating: true,
  minSelected: true,
  maxSelected: true,
});

export const updateFormFieldInput = createInsertSchema(formFieldsTable, {
  label: z.string().min(1).max(200),
})
  .pick({
    type: true,
    label: true,
    description: true,
    placeholder: true,
    order: true,
    required: true,
    minLength: true,
    maxLength: true,
    min: true,
    max: true,
    pattern: true,
    isInteger: true,
    includeTime: true,
    maxRating: true,
    minSelected: true,
    maxSelected: true,
  })
  .partial()
  .extend({ id: z.string().uuid() });

export type FormField = z.infer<typeof formFieldSchema>;
export type CreateFormFieldInput = z.infer<typeof createFormFieldInput>;
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldInput>;
