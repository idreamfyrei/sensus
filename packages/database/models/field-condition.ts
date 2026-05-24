import { pgTable, uuid, text, timestamp, pgEnum, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { formsTable } from "./form";
import { formSectionsTable } from "./form-section";
import { formFieldsTable } from "./form-field";

export const conditionOperatorEnum = pgEnum("condition_operator", [
  "eq",
  "neq",
  "contains",
  "gt",
  "lt",
  "empty",
  "not_empty",
]);

export const conditionActionEnum = pgEnum("condition_action", [
  "show",
  "hide",
  "require",
  "jump_to",
]);

export const fieldConditionsTable = pgTable(
  "field_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    sourceFieldId: uuid("source_field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),

    operator: conditionOperatorEnum("operator").notNull(),
    value: text("value"),

    action: conditionActionEnum("action").notNull(),

    targetFieldId: uuid("target_field_id").references(() => formFieldsTable.id, {
      onDelete: "restrict",
    }),
    targetSectionId: uuid("target_section_id").references(() => formSectionsTable.id, {
      onDelete: "restrict",
    }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    targetXor: check(
      "field_conditions_target_xor",
      sql`(${table.targetFieldId} IS NOT NULL AND ${table.targetSectionId} IS NULL)
         OR (${table.targetFieldId} IS NULL AND ${table.targetSectionId} IS NOT NULL)`,
    ),
    formSourceIdx: index("field_conditions_form_source_idx").on(table.formId, table.sourceFieldId),
    targetFieldIdx: index("field_conditions_target_field_idx").on(table.targetFieldId),
    targetSectionIdx: index("field_conditions_target_section_idx").on(table.targetSectionId),
  }),
);

export type SelectFieldCondition = typeof fieldConditionsTable.$inferSelect;
export type InsertFieldCondition = typeof fieldConditionsTable.$inferInsert;
