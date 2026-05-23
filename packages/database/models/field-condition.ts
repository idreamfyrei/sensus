import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { formFieldsTable } from "./form-field";
import { formTable } from "./form";

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

export const conditionTargetTypeEnum = pgEnum("condition_target_type", ["field", "section"]);

export const fieldConditionsTable = pgTable(
  "field_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formTable.id, { onDelete: "restrict" }),

    sourceFieldId: uuid("field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),

    operator: conditionOperatorEnum("operator").notNull(),
    value: text("value"),

    action: conditionActionEnum("action").notNull(),
    targetType: conditionTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formSourceIdx: index("field_conditions_form_source_idx").on(table.formId, table.sourceFieldId),
  }),
);
