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
              <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
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
