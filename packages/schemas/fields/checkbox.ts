import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type CheckboxAnswer = boolean;

// A single confirmation checkbox (e.g. "I agree to the terms"). For
// groups-of-checkboxes UX, use multi_select instead.
export const checkboxFieldType: FieldTypeDef<CheckboxAnswer> = {
  type: "checkbox",
  label: "Checkbox",
  description: "Single yes/no confirmation.",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    const s = z.boolean();
    if (field.required) {
      return s.refine((v) => v === true, { message: "Must be checked" });
    }
    return s;
  },
};
