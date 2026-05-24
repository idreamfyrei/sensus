import {} from "drizzle-orm/pg-core";
import { formFieldsTable } from "./form-field";
import { responseTable } from "./response";

export const responseAnswerTable = pgTable(
  "response_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    responseId: uuid("response_id")
      .notNull()
      .references(() => responseTable.id, { onDelete: "restrict" }),

    formFieldId: uuid("form_field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),

    valueText: text("value_text").notNull(),
    valueJson: text("value_json"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    responseFieldIdx: index("response_answers_response_id_form_field_id_idx").on(table.responseId),
    formFieldIdx: index("response_answers_form_field_id_idx").on(table.formFieldId),
  }),
);
