import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";
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

export const updateFormSectionInput = createUpdateSchema(formSectionsTable)
  .pick({
    order: true,
    title: true,
    description: true,
    pageBreakBefore: true,
    showIntroScreen: true,
  })
  .extend({ id: z.string().uuid() });

export type FormSection = z.infer<typeof formSectionSchema>;
export type CreateFormSectionInput = z.infer<typeof createFormSectionInput>;
export type UpdateFormSectionInput = z.infer<typeof updateFormSectionInput>;
