import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { responseAnswersTable } from "@repo/database";
import { z } from "zod";

export const responseAnswerSchema = createSelectSchema(responseAnswersTable);

/**
 * Used by the submission service to build response_answers rows. Exactly one
 * of valueText / valueJson is set per row — matching the schema rule that
 * text-shaped answers go in valueText and multi_select / checkbox-group go
 * in valueJson.
 */
export const createResponseAnswerInput = createInsertSchema(responseAnswersTable)
  .pick({
    responseId: true,
    formFieldId: true,
    valueText: true,
    valueJson: true,
  })
  .refine((data) => (data.valueText != null) !== (data.valueJson != null), {
    message: "Exactly one of valueText / valueJson must be set",
  });

export type ResponseAnswer = z.infer<typeof responseAnswerSchema>;
export type CreateResponseAnswerInput = z.infer<typeof createResponseAnswerInput>;
