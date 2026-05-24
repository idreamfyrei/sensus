import { createSelectSchema } from "drizzle-zod";
import { responseDraftsTable } from "@repo/database";
import { z } from "zod";

export const responseDraftSchema = createSelectSchema(responseDraftsTable);

/**
 * Server-side upsert wire shape for invite-only resume. Answers are a
 * fieldId → value map; the deeper per-field validation happens in
 * Phase 2 once the form schema is known.
 */
export const upsertResponseDraftInput = z.object({
  inviteId: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()),
});

export type ResponseDraft = z.infer<typeof responseDraftSchema>;
export type UpsertResponseDraftInput = z.infer<typeof upsertResponseDraftInput>;
