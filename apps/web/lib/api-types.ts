import type { FormService, FormWithSchema, ResponseService, ThemeService } from "@repo/services";

export type FormSummary = Awaited<ReturnType<FormService["listByUser"]>>[number];
export type PublicFormSummary = Awaited<ReturnType<FormService["listPublic"]>>[number];
export type ThemePreset = Awaited<ReturnType<ThemeService["listPresets"]>>[number];
export type FormResponseList = Awaited<ReturnType<ResponseService["listByForm"]>>;
export type FormResponseRow = FormResponseList["responses"][number];

export type FormSchema = FormWithSchema;
export type FormSection = FormSchema["sections"][number];
export type FormField = FormSection["fields"][number];
export type FormCondition = FormSchema["conditions"][number];
