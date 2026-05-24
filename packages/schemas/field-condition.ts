import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { fieldConditionsTable } from "@repo/database";
import { z } from "zod";

export const fieldConditionSchema = createSelectSchema(fieldConditionsTable);

/**
 * Wire-side enforcement of the same XOR invariant the DB CHECK guarantees:
 * exactly one of targetFieldId / targetSectionId is set per condition.
 * Defense in depth — bad requests get rejected before they hit the DB.
 */
const targetXorRefine = (data: {
  targetFieldId?: string | null;
  targetSectionId?: string | null;
}) =>
  (data.targetFieldId != null && data.targetSectionId == null) ||
  (data.targetFieldId == null && data.targetSectionId != null);

const targetXorMessage = "Exactly one of targetFieldId / targetSectionId must be set";

export const createFieldConditionInput = createInsertSchema(fieldConditionsTable)
  .pick({
    formId: true,
    sourceFieldId: true,
    operator: true,
    value: true,
    action: true,
    targetFieldId: true,
    targetSectionId: true,
  })
  .refine(targetXorRefine, { message: targetXorMessage });

export const updateFieldConditionInput = createInsertSchema(fieldConditionsTable)
  .pick({
    operator: true,
    value: true,
    action: true,
    targetFieldId: true,
    targetSectionId: true,
  })
  .partial()
  .extend({ id: z.string().uuid() })
  .refine(targetXorRefine, { message: targetXorMessage });

export type FieldCondition = z.infer<typeof fieldConditionSchema>;
export type CreateFieldConditionInput = z.infer<typeof createFieldConditionInput>;
export type UpdateFieldConditionInput = z.infer<typeof updateFieldConditionInput>;
