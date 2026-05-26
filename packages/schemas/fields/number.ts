import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type NumberAnswer = number;

export const numberFieldType: FieldTypeDef<NumberAnswer> = {
  type: "number",
  label: "Number",
  description: "Numeric input (integer or decimal).",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    let s = field.isInteger ? z.number().int() : z.number();
    if (field.min != null) s = s.min(field.min);
    if (field.max != null) s = s.max(field.max);
    return field.required ? s : s.optional();
  },
};
