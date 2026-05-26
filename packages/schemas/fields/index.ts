import type { FieldTypeDef, FieldType } from "./types";
import { shortTextFieldType } from "./short-text";
import { longTextFieldType } from "./long-text";
import { emailFieldType } from "./email";
import { numberFieldType } from "./number";
import { singleSelectFieldType } from "./single-select";
import { multiSelectFieldType } from "./multi-select";
import { checkboxFieldType } from "./checkbox";
import { dropdownFieldType } from "./dropdown";
import { ratingFieldType } from "./rating";
import { dateFieldType } from "./date";

export * from "./types";
export * from "./short-text";
export * from "./long-text";
export * from "./email";
export * from "./number";
export * from "./single-select";
export * from "./multi-select";
export * from "./checkbox";
export * from "./dropdown";
export * from "./rating";
export * from "./date";

export const FIELD_TYPES_CATALOG: Record<FieldType, FieldTypeDef> = {
  short_text: shortTextFieldType,
  long_text: longTextFieldType,
  email: emailFieldType,
  number: numberFieldType,
  single_select: singleSelectFieldType,
  multi_select: multiSelectFieldType,
  checkbox: checkboxFieldType,
  dropdown: dropdownFieldType,
  rating: ratingFieldType,
  date: dateFieldType,
};

export function getFieldTypeDef(type: FieldType): FieldTypeDef {
  return FIELD_TYPES_CATALOG[type];
}
