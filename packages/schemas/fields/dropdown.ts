import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type DropdownAnswer = string;

// Same data model as single_select; different UI affordance (closed dropdown
// vs. visible radio list). The renderer can branch on `field.type`.
export const dropdownFieldType: FieldTypeDef<DropdownAnswer> = {
  type: "dropdown",
  label: "Dropdown",
  description: "Choose one option from a closed list.",
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
