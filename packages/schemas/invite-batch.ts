import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { inviteBatchesTable } from "@repo/database";
import { z } from "zod";

export const inviteBatchSchema = createSelectSchema(inviteBatchesTable);

export const createInviteBatchInput = createInsertSchema(inviteBatchesTable, {
  originalFilename: (s) => s.min(1).max(500),
  cloudinaryUrl: (s) => s.url(),
}).pick({
  formId: true,
  cloudinaryUrl: true,
  originalFilename: true,
  totalCount: true,
});

export type InviteBatch = z.infer<typeof inviteBatchSchema>;
export type CreateInviteBatchInput = z.infer<typeof createInviteBatchInput>;
