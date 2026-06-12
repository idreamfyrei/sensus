"use client";

import type { FieldType } from "@repo/schemas/fields";
import { Controller, type Control, type FieldValues } from "react-hook-form";
import type { RouterOutputs } from "@repo/trpc/client";

import {
  CheckboxSingleInput,
  DateInput,
  DropdownInput,
  EmailInput,
  LongTextInput,
  MultiSelectInput,
  NumberInput,
  RatingInput,
  ShortTextInput,
  SingleSelectInput,
} from "./inputs";

type FieldRow = RouterOutputs["publicForm"]["getBySlug"]["sections"][number]["fields"][number];

function friendlyFieldError(field: FieldRow, message: string | undefined): string {
  const raw = message ?? "";
  const lower = raw.toLowerCase();
  const isRequired =
    lower.includes("required") ||
    lower.includes("received undefined") ||
    lower.includes("received null");

  if (raw === "Must be checked") return "Check this box to continue.";

  switch (field.type) {
    case "single_select":
    case "dropdown":
      return "Choose one option to continue.";
    case "multi_select": {
      const minimum = Math.max(1, field.minSelected ?? (field.required ? 1 : 0));
      if (lower.includes("too small") || isRequired) {
        return minimum > 1
          ? `Choose at least ${minimum} options to continue.`
          : "Choose at least one option to continue.";
      }
      if (lower.includes("too big") && field.maxSelected != null) {
        return `Choose no more than ${field.maxSelected} options.`;
      }
      return "Choose from the available options.";
    }
    case "checkbox":
      return "Check this box to continue.";
    case "email":
      return isRequired ? "Enter an email address." : "Enter a valid email address.";
    case "number":
      if (lower.includes("too small") && field.min != null) return `Enter ${field.min} or more.`;
      if (lower.includes("too big") && field.max != null) return `Enter ${field.max} or less.`;
      return isRequired ? "Enter a number." : "Enter a valid number.";
    case "rating":
      return "Choose a rating to continue.";
    case "date":
      return field.includeTime ? "Enter a valid date and time." : "Enter a valid date.";
    case "short_text":
    case "long_text":
      if (lower.includes("too small") && field.minLength != null) {
        return `Enter at least ${field.minLength} characters.`;
      }
      if (lower.includes("too big") && field.maxLength != null) {
        return `Keep this under ${field.maxLength} characters.`;
      }
      return "Answer this question to continue.";
  }

  return "Please check this answer and try again.";
}

export function FieldRenderer({
  field,
  control,
  onValueChange,
}: {
  field: FieldRow;
  control: Control<FieldValues>;
  onValueChange?: (fieldId: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="font-medium text-sm">
          {field.label}
          {field.required && <span className="sensus-accent ml-1">*</span>}
        </span>
        {field.description && <p className="sensus-muted text-xs mt-0.5">{field.description}</p>}
      </label>

      <Controller
        control={control}
        name={field.id}
        shouldUnregister={false}
        render={({ field: rhf, fieldState }) => (
          <>
            <FieldInput
              type={field.type}
              field={field}
              value={rhf.value}
              onChange={(value) => {
                rhf.onChange(value);
                onValueChange?.(field.id, value);
              }}
            />
            {fieldState.error && (
              <p className="text-xs text-red-600 mt-1">
                {friendlyFieldError(field, fieldState.error.message)}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
}

function FieldInput({
  type,
  field,
  value,
  onChange,
}: {
  type: FieldType;
  field: FieldRow;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (type) {
    case "short_text":
      return (
        <ShortTextInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
    case "long_text":
      return (
        <LongTextInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
    case "email":
      return (
        <EmailInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
    case "number":
      return (
        <NumberInput
          field={field}
          value={value as number | undefined}
          onChange={onChange as (v: number | undefined) => void}
        />
      );
    case "single_select":
      return (
        <SingleSelectInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
    case "multi_select":
      return (
        <MultiSelectInput
          field={field}
          value={(value as string[]) ?? []}
          onChange={onChange as (v: string[]) => void}
        />
      );
    case "checkbox":
      return (
        <CheckboxSingleInput
          field={field}
          value={(value as boolean) ?? false}
          onChange={onChange as (v: boolean) => void}
        />
      );
    case "dropdown":
      return (
        <DropdownInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
    case "rating":
      return (
        <RatingInput
          field={field}
          value={value as number | undefined}
          onChange={onChange as (v: number | undefined) => void}
        />
      );
    case "date":
      return (
        <DateInput
          field={field}
          value={(value as string) ?? ""}
          onChange={onChange as (v: string) => void}
        />
      );
  }
}
