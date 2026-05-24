import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const formViewsTable = pgTable(
  "form_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    viewedAt: timestamp("viewed_at").notNull().defaultNow(),

    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formViewedIdx: index("form_views_form_viewed_idx").on(table.formId, table.viewedAt),
  }),
);

export type SelectFormView = typeof formViewsTable.$inferSelect;
export type InsertFormView = typeof formViewsTable.$inferInsert;
