"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { AddFieldSection } from "./add-field-section";
import { SortableFieldCard } from "./sortable-field-card";
import type { FormField, FormSchema, FormSection } from "~/lib/api-types";

type SectionRow = FormSection;
type FieldRow = FormField;

type SectionCardProps = {
  section: SectionRow;
  form: FormSchema;
  otherSections: Array<{ id: string; title: string | null }>;
  fullLayout: Array<{ sectionId: string; fieldIds: string[] }>;
  canDelete: boolean;
  disabled: boolean;
};

export function SectionCard({
  section,
  form,
  otherSections,
  fullLayout,
  canDelete,
  disabled,
}: SectionCardProps) {
  const formId = form.id;
  const sortable = useSortable({
    id: section.id,
    data: { type: "section" },
    disabled,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const utils = trpc.useUtils();
  const [title, setTitle] = useState(section.title ?? "");
  const [description, setDescription] = useState(section.description ?? "");

  const update = trpc.sections.update.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });
  const del = trpc.sections.delete.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });
  const reorderAll = trpc.fields.reorderAll.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fieldIds: string[] = section.fields.map((f) => f.id);

  const onFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fieldIds.indexOf(String(active.id));
    const newIndex = fieldIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove<string>(fieldIds, oldIndex, newIndex);
    const next = fullLayout.map((s) =>
      s.sectionId === section.id ? { sectionId: s.sectionId, fieldIds: newOrder } : s,
    );
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
      className="bg-neutral-50 border border-neutral-200 rounded-lg"
    >
      <header className="flex items-start gap-2 p-4 border-b border-neutral-200">
        <button
          type="button"
          aria-label="Reorder section"
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 mt-2 cursor-grab touch-none text-neutral-400 hover:text-neutral-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              const next = title.trim() === "" ? null : title.trim();
              if (next !== (section.title ?? null)) {
                update.mutate({ sectionId: section.id, patch: { title: next } });
              }
            }}
            placeholder="Section title (optional)"
            className="font-medium"
            disabled={disabled}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              const next = description.trim() === "" ? null : description.trim();
              if (next !== (section.description ?? null)) {
                update.mutate({ sectionId: section.id, patch: { description: next } });
              }
            }}
            placeholder="Section description (optional)"
            rows={2}
            disabled={disabled}
            className="w-full text-sm border border-neutral-200 rounded px-2 py-1.5 resize-y disabled:bg-neutral-100"
          />
          <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={section.pageBreakBefore}
                onChange={(e) =>
                  update.mutate({
                    sectionId: section.id,
                    patch: { pageBreakBefore: e.target.checked },
                  })
                }
                disabled={disabled}
                className="rounded"
              />
              Page break before
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={section.showIntroScreen}
                onChange={(e) =>
                  update.mutate({
                    sectionId: section.id,
                    patch: { showIntroScreen: e.target.checked },
                  })
                }
                disabled={disabled}
                className="rounded"
              />
              Show intro screen
            </label>
          </div>
        </div>

        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => del.mutate({ sectionId: section.id })}
            disabled={disabled || del.isPending}
            className="text-red-600 h-8 w-8 p-0"
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </header>

      {del.error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs">
          {del.error.message}
        </div>
      )}
      {update.error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs">
          {update.error.message}
        </div>
      )}

      <div className="p-4 space-y-3">
        {section.fields.length === 0 && (
          <p className="text-sm text-neutral-500 italic text-center py-4">
            {disabled ? "No fields. Respondents see only the title and Submit." : "No fields yet."}
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFieldDragEnd}>
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            {section.fields.map((field: FieldRow) => (
              <SortableFieldCard
                key={field.id}
                field={field}
                form={form}
                currentSectionId={section.id}
                otherSections={otherSections}
                layoutForMove={fullLayout}
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!disabled && <AddFieldSection formId={formId} sectionId={section.id} />}
      </div>
    </div>
  );
}
