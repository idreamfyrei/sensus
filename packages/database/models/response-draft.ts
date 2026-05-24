import { pgTable, uuid, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { formInvitesTable } from "./form-invite";

export const responseDraftsTable = pgTable(
  "response_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    inviteId: uuid("invite_id").references(() => formInvitesTable.id, { onDelete: "restrict" }),

    answers: jsonb("answers").notNull().default({}),

    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    inviteUnique: uniqueIndex("response_drafts_invite_unique")
      .on(table.inviteId)
      .where(sql`deleted_at IS NULL AND invite_id IS NOT NULL`),
  }),
);

export type SelectResponseDraft = typeof responseDraftsTable.$inferSelect;
export type InsertResponseDraft = typeof responseDraftsTable.$inferInsert;
