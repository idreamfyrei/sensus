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
import { formsTable } from "./form";
import { formSectionsTable } from "./form-section";

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "dropdown",
  "rating",
  "date",
]);

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => formSectionsTable.id, { onDelete: "restrict" }),

    type: fieldTypeEnum("type").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    placeholder: text("placeholder"),
    order: integer("order").notNull(),
    required: boolean("required").notNull().default(false),

    minLength: integer("min_length"),
    maxLength: integer("max_length"),
    min: integer("min"),
    max: integer("max"),
    pattern: text("pattern"),
    isInteger: boolean("is_integer"),
    includeTime: boolean("include_time"),
    maxRating: integer("max_rating"),
    minSelected: integer("min_selected"),
    maxSelected: integer("max_selected"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formOrderIdx: index("form_fields_form_order_idx").on(table.formId, table.order),
    sectionOrderIdx: index("form_fields_section_order_idx").on(table.sectionId, table.order),
  }),
);

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
