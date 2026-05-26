import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Hash,
  ListChecks,
  Mail,
  Star,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { FieldType } from "@repo/schemas/fields";

export const FIELD_ICONS: Record<FieldType, LucideIcon> = {
  short_text: Type,
  long_text: AlignLeft,
  email: Mail,
  number: Hash,
  single_select: CircleDot,
  multi_select: ListChecks,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  rating: Star,
  date: Calendar,
};
