import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type MultiSelectAnswer = string[];

export const multiSelectFieldType: FieldTypeDef<MultiSelectAnswer> = {
  type: "multi_select",
  label: "Multi-select",
  description: "Choose any number of options from a list.",
  hasOptions: true,
  answerKind: "json",
  buildAnswerSchema(field, optionValues = []) {
    const element =
      optionValues.length === 0 ? z.string() : z.enum(optionValues as [string, ...string[]]);
    let s = z.array(element);
    if (field.minSelected != null) s = s.min(field.minSelected);
    if (field.maxSelected != null) s = s.max(field.maxSelected);
    if (field.required) {
      const min = Math.max(1, field.minSelected ?? 1);
      s = s.min(min);
    }
    return s;
  },
};
