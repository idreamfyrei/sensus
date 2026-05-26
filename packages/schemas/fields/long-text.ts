import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type LongTextAnswer = string;

export const longTextFieldType: FieldTypeDef<LongTextAnswer> = {
  type: "long_text",
  label: "Long text",
  description: "Multi-line paragraph input.",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    let s = z.string();
    if (field.minLength != null) s = s.min(field.minLength);
    if (field.maxLength != null) s = s.max(field.maxLength);
    if (field.required) {
      const min = Math.max(1, field.minLength ?? 1);
      s = s.min(min);
      return s;
    }
    return s.optional();
  },
};
