import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type SingleSelectAnswer = string;

export const singleSelectFieldType: FieldTypeDef<SingleSelectAnswer> = {
  type: "single_select",
  label: "Single select",
  description: "Choose one option from a list.",
  hasOptions: true,
  answerKind: "text",
  buildAnswerSchema(field, optionValues = []) {
    if (optionValues.length === 0) {
      const s = z.string().min(1);
      return field.required ? s : s.optional();
    }
    const e = z.enum(optionValues as [string, ...string[]]);
    return field.required ? e : e.optional();
  },
};
