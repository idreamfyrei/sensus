"use client";

import { GripVertical, MoveRight } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FIELD_TYPES_CATALOG } from "@repo/schemas/fields";
import { FieldCard } from "./field-card";
import { ConditionsEditor } from "./conditions-editor";
import { trpc } from "~/trpc/client";
import type { FormSchema } from "~/lib/api-types";

type FieldRow = Parameters<typeof FieldCard>[0]["field"];
type FormShape = FormSchema;

type SortableFieldCardProps = {
  field: FieldRow;
  form: FormShape;
  currentSectionId: string;
  otherSections: ReadonlyArray<{ id: string; title: string | null }>;
  layoutForMove: Array<{ sectionId: string; fieldIds: string[] }>;
};

export function SortableFieldCard({
  field,
  form,
  currentSectionId,
  otherSections,
  layoutForMove,
}: SortableFieldCardProps) {
  const formId = form.id;
  const fullFieldFromForm = form.sections.flatMap((s) => s.fields).find((f) => f.id === field.id);
  const sortable = useSortable({
    id: field.id,
    data: { type: "field", sectionId: currentSectionId },
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const utils = trpc.useUtils();
  const reorderAll = trpc.fields.reorderAll.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });

  const handleMoveTo = (targetSectionId: string) => {
    const next = layoutForMove.map((s) => ({
      sectionId: s.sectionId,
      fieldIds:
        s.sectionId === currentSectionId
          ? s.fieldIds.filter((id) => id !== field.id)
          : s.sectionId === targetSectionId
            ? [...s.fieldIds, field.id]
            : [...s.fieldIds],
    }));
    reorderAll.mutate({ formId, sections: next });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-stretch gap-2"
    >
      <button
        type="button"
        aria-label="Reorder field"
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 cursor-grab touch-none text-neutral-400 hover:text-neutral-700 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 space-y-2">
        <FieldCard field={field} hasOptions={FIELD_TYPES_CATALOG[field.type].hasOptions} />

        {fullFieldFromForm && <ConditionsEditor field={fullFieldFromForm} form={form} />}

        {otherSections.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 pl-7">
            <MoveRight className="h-3 w-3" />
            <label className="flex items-center gap-1">
              Move to:
              <select
                onChange={(e) => {
                  const target = e.target.value;
                  e.target.value = "";
                  if (target) handleMoveTo(target);
                }}
                defaultValue=""
                disabled={reorderAll.isPending}
                className="border border-neutral-200 rounded px-1 h-6 text-xs"
              >
                <option value="" disabled>
                  Choose section…
                </option>
                {otherSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title?.trim() ? s.title : "Untitled section"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
