import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const formSectionsTable = pgTable(
  "form_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    order: integer("order").notNull(),
    title: text("title"),
    description: text("description"),

    pageBreakBefore: boolean("page_break_before").notNull().default(false),
    showIntroScreen: boolean("show_intro_screen").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formOrderIdx: index("form_sections_form_order_idx").on(table.formId, table.order),
  }),
);

export type SelectFormSection = typeof formSectionsTable.$inferSelect;
export type InsertFormSection = typeof formSectionsTable.$inferInsert;
