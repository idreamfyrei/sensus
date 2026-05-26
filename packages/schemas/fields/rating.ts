import { z } from "zod";
import type { FieldTypeDef } from "./types";

export type RatingAnswer = number;

export const ratingFieldType: FieldTypeDef<RatingAnswer> = {
  type: "rating",
  label: "Rating",
  description: "Rate from 1 to maxRating (default 5).",
  hasOptions: false,
  answerKind: "text",
  buildAnswerSchema(field) {
    const max = field.maxRating ?? 5;
    const s = z.number().int().min(1).max(max);
    return field.required ? s : s.optional();
  },
};
