import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type EmailAnswer = string;

export const emailFieldType: FieldTypeDef<EmailAnswer> = {
  type: "email",
  label: "Email",
  description: "Email address input.",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    const s = z.string().email();
    if (field.required) return s;
    return s.optional().or(z.literal(""));
  },
};
