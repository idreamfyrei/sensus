import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { formTable } from "./form";

export const responseTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "restrict" }),

    submittedAt: timestamp("submitted_at").notNull().defaultNow(),

    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formIdx: index("responses_form_id_idx").on(table.formId, table.submittedAt),
  }),
);

export type SelectResponse = typeof responseTable.$inferSelect;
export type InsertResponse = typeof responseTable.$inferInsert;
