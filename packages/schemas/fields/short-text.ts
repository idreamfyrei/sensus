import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type ShortTextAnswer = string;

export const shortTextFieldType: FieldTypeDef<ShortTextAnswer> = {
  type: "short_text",
  label: "Short text",
  description: "Single-line text input.",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    let s = z.string();
    if (field.minLength != null) s = s.min(field.minLength);
    if (field.maxLength != null) s = s.max(field.maxLength);
    if (field.pattern) s = s.regex(new RegExp(field.pattern));
    if (field.required) {
      const min = Math.max(1, field.minLength ?? 1);
      s = s.min(min);
      return s;
    }
    return s.optional();
  },
};
