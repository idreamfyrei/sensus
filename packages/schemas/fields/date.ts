import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type DateAnswer = string;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

export const dateFieldType: FieldTypeDef<DateAnswer> = {
  type: "date",
  label: "Date",
  description: "ISO date (or date-time if includeTime is set).",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    const s = z.string().regex(field.includeTime ? DATE_TIME : DATE_ONLY);
    return field.required ? s : s.optional();
  },
};
