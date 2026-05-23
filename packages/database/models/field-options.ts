import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { formFieldsTable } from "./form-field";

export const fieldOptionTable = pgTable(
  "field_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),

    label: text("label").notNull(),
    value: text("value").notNull(),
    order: integer("order").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    fieldOrderIdx: index("field_options_field_order_idx").on(table.fieldId, table.order),
  }),
);

export type SelectFieldOption = typeof fieldOptionTable.$inferSelect;
export type InsertFieldOption = typeof fieldOptionTable.$inferInsert;
