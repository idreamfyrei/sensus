"use client";

import { Star } from "lucide-react";

type FieldRow = {
  id: string;
  label: string;
  description: string | null;
  placeholder: string | null;
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
  options: ReadonlyArray<{ id: string; label: string; value: string }>;
};

type Props<T> = {
  field: FieldRow;
  value: T;
  onChange: (v: T) => void;
};

const baseInput =
  "w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-neutral-900 transition";

export function ShortTextInput({ field, value, onChange }: Props<string>) {
  return (
    <input
      type="text"
      placeholder={field.placeholder ?? ""}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.maxLength ?? undefined}
      className={baseInput}
    />
  );
}

export function LongTextInput({ field, value, onChange }: Props<string>) {
  return (
    <textarea
      placeholder={field.placeholder ?? ""}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.maxLength ?? undefined}
      rows={4}
      className={baseInput}
    />
  );
}

export function EmailInput({ field, value, onChange }: Props<string>) {
  return (
    <input
      type="email"
      placeholder={field.placeholder ?? "you@example.com"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    />
  );
}

export function NumberInput({ field, value, onChange }: Props<number | undefined>) {
  return (
    <input
      type="number"
      placeholder={field.placeholder ?? ""}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") return onChange(undefined);
        const n = Number(v);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
      step={field.isInteger ? 1 : "any"}
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      className={baseInput}
    />
  );
}

export function SingleSelectInput({ field, value, onChange }: Props<string>) {
  return (
    <div className="space-y-2">
      {field.options.map((o) => (
        <label
          key={o.id}
          className="flex items-center gap-2 p-2 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50"
        >
          <input
            type="radio"
            name={field.id}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function MultiSelectInput({ field, value, onChange }: Props<string[]>) {
  const selected = value ?? [];
  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };
  return (
    <div className="space-y-2">
      {field.options.map((o) => (
        <label
          key={o.id}
          className="flex items-center gap-2 p-2 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50"
        >
          <input
            type="checkbox"
            value={o.value}
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function CheckboxSingleInput({ field, value, onChange }: Props<boolean>) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm">{field.description ?? "I confirm"}</span>
    </label>
  );
}

export function DropdownInput({ field, value, onChange }: Props<string>) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={baseInput}>
      <option value="">Select…</option>
      {field.options.map((o) => (
        <option key={o.id} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RatingInput({ field, value, onChange }: Props<number | undefined>) {
  const max = field.maxRating ?? 5;
  const current = value ?? 0;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const active = current >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} of ${max}`}
            className="p-1"
          >
            <Star
              className={`h-7 w-7 transition ${
                active ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"
              }`}
            />
          </button>
        );
      })}
      {current > 0 && !field.required && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="ml-2 text-xs text-neutral-500 hover:text-neutral-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function DateInput({ field, value, onChange }: Props<string>) {
  return (
    <input
      type={field.includeTime ? "datetime-local" : "date"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    />
  );
}
