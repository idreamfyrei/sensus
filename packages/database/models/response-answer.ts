import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { formFieldsTable } from "./form-field";
import { responsesTable } from "./response";

export const responseAnswersTable = pgTable(
  "response_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    responseId: uuid("response_id")
      .notNull()
      .references(() => responsesTable.id, { onDelete: "restrict" }),

    formFieldId: uuid("form_field_id")
      .notNull()
      .references(() => formFieldsTable.id, { onDelete: "restrict" }),

    valueText: text("value_text"),
    valueJson: jsonb("value_json"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    responseIdx: index("response_answers_response_idx").on(table.responseId),
    formFieldIdx: index("response_answers_form_field_idx").on(table.formFieldId),
  }),
);

export type SelectResponseAnswer = typeof responseAnswersTable.$inferSelect;
export type InsertResponseAnswer = typeof responseAnswersTable.$inferInsert;
