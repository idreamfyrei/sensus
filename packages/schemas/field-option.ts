import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { fieldOptionsTable } from "@repo/database";
import { z } from "zod";

export const fieldOptionSchema = createSelectSchema(fieldOptionsTable);

export const createFieldOptionInput = createInsertSchema(fieldOptionsTable, {
  label: (s) => s.min(1).max(200),
}).pick({
  fieldId: true,
  label: true,
  value: true,
  order: true,
});

export const updateFieldOptionInput = createUpdateSchema(fieldOptionsTable)
  .pick({ label: true, value: true, order: true })
  .extend({ id: z.string().uuid() });

export type FieldOption = z.infer<typeof fieldOptionSchema>;
export type CreateFieldOptionInput = z.infer<typeof createFieldOptionInput>;
export type UpdateFieldOptionInput = z.infer<typeof updateFieldOptionInput>;
