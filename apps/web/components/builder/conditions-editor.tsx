"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { RouterOutputs } from "@repo/trpc/client";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";

type FormShape = RouterOutputs["forms"]["get"];
type Condition = FormShape["conditions"][number];
type Section = FormShape["sections"][number];
type Field = Section["fields"][number];

type Operator = Condition["operator"];
type Action = Condition["action"];

const OPERATOR_OPTIONS: Array<{ value: Operator; label: string; needsValue: boolean }> = [
  { value: "eq", label: "equals", needsValue: true },
  { value: "neq", label: "does not equal", needsValue: true },
  { value: "contains", label: "contains", needsValue: true },
  { value: "gt", label: "greater than", needsValue: true },
  { value: "lt", label: "less than", needsValue: true },
  { value: "empty", label: "is empty", needsValue: false },
  { value: "not_empty", label: "is not empty", needsValue: false },
];

const ACTION_OPTIONS: Array<{ value: Action; label: string }> = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
  { value: "require", label: "Require" },
  { value: "jump_to", label: "Jump to" },
];

type TargetSelection =
  | { kind: "none" }
  | { kind: "field"; id: string }
  | { kind: "section"; id: string };

function parseTarget(condition: Condition): TargetSelection {
  if (condition.targetFieldId) return { kind: "field", id: condition.targetFieldId };
  if (condition.targetSectionId) return { kind: "section", id: condition.targetSectionId };
  return { kind: "none" };
}

function serializeTarget(target: TargetSelection): {
  targetFieldId: string | null;
  targetSectionId: string | null;
} {
  if (target.kind === "field") return { targetFieldId: target.id, targetSectionId: null };
  if (target.kind === "section") return { targetFieldId: null, targetSectionId: target.id };
  return { targetFieldId: null, targetSectionId: null };
}

function targetKey(t: TargetSelection): string {
  if (t.kind === "none") return "";
  return `${t.kind}:${t.id}`;
}

function parseTargetKey(key: string): TargetSelection {
  if (key.startsWith("field:")) return { kind: "field", id: key.slice("field:".length) };
  if (key.startsWith("section:")) return { kind: "section", id: key.slice("section:".length) };
  return { kind: "none" };
}

function targetLabel(target: TargetSelection, form: FormShape): string {
  if (target.kind === "none") return "(no target)";
  if (target.kind === "field") {
    for (const s of form.sections) {
      const f = s.fields.find((field) => field.id === target.id);
      if (f) return `Field · ${f.label || "Untitled"}`;
    }
    return "Field · (unknown)";
  }
  const sec = form.sections.find((s) => s.id === target.id);
  return `Section · ${sec?.title?.trim() || "Untitled section"}`;
}

export function ConditionsEditor({ field, form }: { field: Field; form: FormShape }) {
  const utils = trpc.useUtils();
  const [adding, setAdding] = useState(false);

  const conditions = form.conditions.filter((c) => c.sourceFieldId === field.id);

  const otherFields = form.sections.flatMap((s) => s.fields.filter((f) => f.id !== field.id));
  const allSections = form.sections;

  const add = trpc.conditions.add.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate({ id: form.id });
      setAdding(false);
    },
  });
  const update = trpc.conditions.update.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: form.id }),
  });
  const del = trpc.conditions.delete.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: form.id }),
  });

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-neutral-500">Conditional logic</span>
        {!adding && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add rule
          </Button>
        )}
      </div>

      {conditions.map((c) => (
        <ConditionRow
          key={c.id}
          condition={c}
          form={form}
          otherFields={otherFields}
          allSections={allSections}
          onUpdate={(patch) => update.mutate({ conditionId: c.id, patch })}
          onDelete={() => del.mutate({ conditionId: c.id })}
          updating={update.isPending && update.variables?.conditionId === c.id}
          deleting={del.isPending && del.variables?.conditionId === c.id}
        />
      ))}

      {adding && (
        <NewConditionRow
          field={field}
          otherFields={otherFields}
          allSections={allSections}
          onSubmit={(payload) =>
            add.mutate({
              formId: form.id,
              sourceFieldId: field.id,
              ...payload,
            })
          }
          onCancel={() => setAdding(false)}
          submitting={add.isPending}
          error={add.error?.message ?? null}
        />
      )}

      {(update.error || del.error) && (
        <p className="text-xs text-red-600">{update.error?.message ?? del.error?.message}</p>
      )}
    </div>
  );
}

function ConditionRow({
  condition,
  form,
  otherFields,
  allSections,
  onUpdate,
  onDelete,
  updating,
  deleting,
}: {
  condition: Condition;
  form: FormShape;
  otherFields: Field[];
  allSections: Section[];
  onUpdate: (patch: {
    operator?: Operator;
    value?: string | null;
    action?: Action;
    targetFieldId?: string | null;
    targetSectionId?: string | null;
  }) => void;
  onDelete: () => void;
  updating: boolean;
  deleting: boolean;
}) {
  const target = parseTarget(condition);
  const opDef = OPERATOR_OPTIONS.find((o) => o.value === condition.operator);

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs bg-neutral-50 rounded p-2">
      <span className="text-neutral-500">IF this field</span>
      <select
        value={condition.operator}
        onChange={(e) => onUpdate({ operator: e.target.value as Operator })}
        disabled={updating}
        className="border border-neutral-200 rounded px-1 h-6"
      >
        {OPERATOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {opDef?.needsValue && (
        <input
          type="text"
          defaultValue={condition.value ?? ""}
          onBlur={(e) => {
            const next = e.target.value === "" ? null : e.target.value;
            if (next !== (condition.value ?? null)) onUpdate({ value: next });
          }}
          disabled={updating}
          placeholder="value"
          className="border border-neutral-200 rounded px-1 h-6 w-24"
        />
      )}

      <span className="text-neutral-500">then</span>

      <select
        value={condition.action}
        onChange={(e) => onUpdate({ action: e.target.value as Action })}
        disabled={updating}
        className="border border-neutral-200 rounded px-1 h-6"
      >
        {ACTION_OPTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>

      <select
        value={targetKey(target)}
        onChange={(e) => {
          const next = parseTargetKey(e.target.value);
          onUpdate(serializeTarget(next));
        }}
        disabled={updating}
        className="border border-neutral-200 rounded px-1 h-6 max-w-[12rem]"
      >
        <option value="" disabled>
          Choose target…
        </option>
        <optgroup label="Fields">
          {otherFields.map((f) => (
            <option key={f.id} value={`field:${f.id}`}>
              {f.label || "Untitled"}
            </option>
          ))}
        </optgroup>
        <optgroup label="Sections">
          {allSections.map((s) => (
            <option key={s.id} value={`section:${s.id}`}>
              {s.title?.trim() || "Untitled section"}
            </option>
          ))}
        </optgroup>
      </select>

      <span className="sr-only">{targetLabel(target, form)}</span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        className="h-6 w-6 p-0 text-red-600 ml-auto"
        aria-label="Delete condition"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function NewConditionRow({
  field,
  otherFields,
  allSections,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  field: Field;
  otherFields: Field[];
  allSections: Section[];
  onSubmit: (payload: {
    operator: Operator;
    value: string | null;
    action: Action;
    targetFieldId: string | null;
    targetSectionId: string | null;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  void field;
  const [operator, setOperator] = useState<Operator>("eq");
  const [value, setValue] = useState("");
  const [action, setAction] = useState<Action>("show");
  const [targetKeyState, setTargetKeyState] = useState<string>("");

  const opDef = OPERATOR_OPTIONS.find((o) => o.value === operator);
  const target = parseTargetKey(targetKeyState);
  const canSubmit = target.kind !== "none" && !submitting;

  return (
    <div className="bg-neutral-100 rounded p-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <span className="text-neutral-500">IF this field</span>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as Operator)}
          className="border border-neutral-200 rounded px-1 h-6"
        >
          {OPERATOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {opDef?.needsValue && (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="value"
            className="border border-neutral-200 rounded px-1 h-6 w-24"
          />
        )}
        <span className="text-neutral-500">then</span>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as Action)}
          className="border border-neutral-200 rounded px-1 h-6"
        >
          {ACTION_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <select
          value={targetKeyState}
          onChange={(e) => setTargetKeyState(e.target.value)}
          className="border border-neutral-200 rounded px-1 h-6 max-w-[12rem]"
        >
          <option value="">Choose target…</option>
          <optgroup label="Fields">
            {otherFields.map((f) => (
              <option key={f.id} value={`field:${f.id}`}>
                {f.label || "Untitled"}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sections">
            {allSections.map((s) => (
              <option key={s.id} value={`section:${s.id}`}>
                {s.title?.trim() || "Untitled section"}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-6 text-xs">
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canSubmit}
          onClick={() => {
            const t = serializeTarget(target);
            onSubmit({
              operator,
              value: opDef?.needsValue ? (value === "" ? null : value) : null,
              action,
              ...t,
            });
          }}
          className="h-6 text-xs"
        >
          Add rule
        </Button>
      </div>
    </div>
  );
}
