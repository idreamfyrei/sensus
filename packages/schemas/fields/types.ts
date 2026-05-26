import { z } from "zod";
import type { formFieldsTable } from "@repo/database";

export const FIELD_TYPES = [
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
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type FieldRow = typeof formFieldsTable.$inferSelect;

export type AnswerKind = "text" | "json";

// `TAnswer` is documentation-only. Return is z.ZodTypeAny because Zod 4's
// ZodOptional / ZodUnion / .refine() chains don't satisfy z.ZodType<TAnswer>.
export interface FieldTypeDef<_TAnswer = unknown> {
  type: FieldType;
  label: string;
  description: string;
  hasOptions: boolean;
  answerKind: AnswerKind;
  buildAnswerSchema(field: FieldRow, optionValues?: string[]): z.ZodTypeAny;
}
