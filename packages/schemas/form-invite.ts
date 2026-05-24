import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { formInvitesTable } from "@repo/database";
import { z } from "zod";

export const formInviteSchema = createSelectSchema(formInvitesTable);

/**
 * Builds invite rows in bulk from a parsed batch. Tokens are generated
 * server-side (never trust client-provided tokens), so the wire input
 * doesn't expose tokenHash.
 */
export const createFormInviteInput = createInsertSchema(formInvitesTable, {
  email: z.string().email(),
}).pick({
  formId: true,
  batchId: true,
  email: true,
});

export const updateFormInviteStatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "sent", "opened", "submitted"]),
});

export type FormInvite = z.infer<typeof formInviteSchema>;
export type CreateFormInviteInput = z.infer<typeof createFormInviteInput>;
export type UpdateFormInviteStatusInput = z.infer<typeof updateFormInviteStatusInput>;
