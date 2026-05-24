import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { formSectionsTable } from "@repo/database";
import { z } from "zod";

export const formSectionSchema = createSelectSchema(formSectionsTable);

export const createFormSectionInput = createInsertSchema(formSectionsTable).pick({
  formId: true,
  order: true,
  title: true,
  description: true,
  pageBreakBefore: true,
  showIntroScreen: true,
});

export const updateFormSectionInput = createInsertSchema(formSectionsTable)
  .pick({
    order: true,
    title: true,
    description: true,
    pageBreakBefore: true,
    showIntroScreen: true,
  })
  .partial()
  .extend({ id: z.string().uuid() });

export type FormSection = z.infer<typeof formSectionSchema>;
export type CreateFormSectionInput = z.infer<typeof createFormSectionInput>;
export type UpdateFormSectionInput = z.infer<typeof updateFormSectionInput>;
