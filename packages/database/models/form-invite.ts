import { pgTable, uuid, text, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { formsTable } from "./form";
import { inviteBatchesTable } from "./invite-batch";
import { responsesTable } from "./response";

export const inviteStatusEnum = pgEnum("invite_status", ["pending", "sent", "opened", "submitted"]);

export const formInvitesTable = pgTable(
  "form_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    batchId: uuid("batch_id").references(() => inviteBatchesTable.id, { onDelete: "restrict" }),

    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),

    status: inviteStatusEnum("status").notNull().default("pending"),

    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    submittedAt: timestamp("submitted_at"),

    responseId: uuid("response_id").references(() => responsesTable.id, { onDelete: "restrict" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("form_invites_token_hash_unique")
      .on(table.tokenHash)
      .where(sql`deleted_at IS NULL`),

    formEmailIdx: index("form_invites_form_email_idx").on(table.formId, table.email),
    formStatusIdx: index("form_invites_form_status_idx").on(
      table.formId,
      table.status,
      table.createdAt,
    ),
  }),
);

export type SelectFormInvite = typeof formInvitesTable.$inferSelect;
export type InsertFormInvite = typeof formInvitesTable.$inferInsert;
