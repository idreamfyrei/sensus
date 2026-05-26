"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { FieldType } from "@repo/schemas/fields";
import { FIELD_ICONS } from "~/lib/field-meta";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { OptionsEditor } from "./options-editor";

type FieldRow = {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  pattern: string | null;
  isInteger: boolean | null;
  includeTime: boolean | null;
  maxRating: number | null;
  minSelected: number | null;
  maxSelected: number | null;
  options: Array<{ label: string; value: string }>;
};

export function FieldCard({ field, hasOptions }: { field: FieldRow; hasOptions: boolean }) {
  const utils = trpc.useUtils();
  const Icon = FIELD_ICONS[field.type];
  const [label, setLabel] = useState(field.label);

  const update = trpc.fields.update.useMutation({
    onSuccess: () => utils.forms.get.invalidate(),
  });
  const del = trpc.fields.delete.useMutation({
    onSuccess: () => utils.forms.get.invalidate(),
  });

  const saveLabel = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== field.label) {
      update.mutate({ fieldId: field.id, patch: { label: trimmed } });
    }
  };

  const toggleRequired = () => {
    update.mutate({ fieldId: field.id, patch: { required: !field.required } });
  };

  return (
    <div className="border border-neutral-200 bg-white rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={saveLabel}
          placeholder="Question"
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => del.mutate({ fieldId: field.id })}
          disabled={del.isPending}
          className="text-red-600 h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 mt-3 pl-7 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required}
            onChange={toggleRequired}
            className="rounded"
          />
          Required
        </label>
        <FieldConfig field={field} />
      </div>

      {hasOptions && <OptionsEditor fieldId={field.id} initialOptions={field.options} />}

      {update.error && <div className="mt-2 text-xs text-red-600">{update.error.message}</div>}
    </div>
  );
}

function FieldConfig({ field }: { field: FieldRow }) {
  const utils = trpc.useUtils();
  const update = trpc.fields.update.useMutation({
    onSuccess: () => utils.forms.get.invalidate(),
  });

  const patch = (p: Parameters<typeof update.mutate>[0]["patch"]) =>
    update.mutate({ fieldId: field.id, patch: p });

  switch (field.type) {
    case "short_text":
    case "long_text":
      return (
        <>
          <NumInput label="Min" value={field.minLength} onSave={(v) => patch({ minLength: v })} />
          <NumInput label="Max" value={field.maxLength} onSave={(v) => patch({ maxLength: v })} />
          {field.type === "short_text" && (
            <TextInput
              label="Pattern"
              value={field.pattern}
              onSave={(v) => patch({ pattern: v })}
            />
          )}
        </>
      );
    case "number":
      return (
        <>
          <NumInput label="Min" value={field.min} onSave={(v) => patch({ min: v })} />
          <NumInput label="Max" value={field.max} onSave={(v) => patch({ max: v })} />
          <CheckboxInput
            label="Integer only"
            value={field.isInteger}
            onSave={(v) => patch({ isInteger: v })}
          />
        </>
      );
    case "rating":
      return (
        <NumInput
          label="Max rating"
          value={field.maxRating ?? 5}
          onSave={(v) => patch({ maxRating: v ?? 5 })}
        />
      );
    case "date":
      return (
        <CheckboxInput
          label="Include time"
          value={field.includeTime}
          onSave={(v) => patch({ includeTime: v })}
        />
      );
    case "multi_select":
      return (
        <>
          <NumInput
            label="Min picks"
            value={field.minSelected}
            onSave={(v) => patch({ minSelected: v })}
          />
          <NumInput
            label="Max picks"
            value={field.maxSelected}
            onSave={(v) => patch({ maxSelected: v })}
          />
        </>
      );
    default:
      return null;
  }
}

function NumInput({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number | null;
  onSave: (v: number | null) => void;
}) {
  const [v, setV] = useState(value?.toString() ?? "");
  return (
    <label className="flex items-center gap-1 text-xs text-neutral-600">
      {label}:
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const parsed = v.trim() === "" ? null : Number(v);
          if (parsed !== value && !Number.isNaN(parsed as number)) onSave(parsed);
        }}
        className="w-16 px-1 border border-neutral-200 rounded text-sm h-7"
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: (v: string | null) => void;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <label className="flex items-center gap-1 text-xs text-neutral-600">
      {label}:
      <input
        type="text"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const next = v.trim() === "" ? null : v;
          if (next !== value) onSave(next);
        }}
        className="px-1 border border-neutral-200 rounded text-sm h-7 w-32"
      />
    </label>
  );
}

function CheckboxInput({
  label,
  value,
  onSave,
}: {
  label: string;
  value: boolean | null;
  onSave: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onSave(e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  );
}
