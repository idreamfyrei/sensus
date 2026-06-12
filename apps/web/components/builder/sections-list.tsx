"use client";

import { Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { SectionCard } from "./section-card";
import type { FormSchema } from "~/lib/api-types";

type FormShape = FormSchema;

export function SectionsList({ form, disabled }: { form: FormShape; disabled: boolean }) {
  const utils = trpc.useUtils();
  const sectionIds: string[] = form.sections.map((s) => s.id);

  const reorderSections = trpc.sections.reorder.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: form.id }),
  });
  const addSection = trpc.sections.add.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: form.id }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sectionIds.indexOf(String(active.id));
    const newIndex = sectionIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove<string>(sectionIds, oldIndex, newIndex);
    reorderSections.mutate({ formId: form.id, orderedIds: newOrder });
  };

  const fullLayout = form.sections.map((s) => ({
    sectionId: s.id,
    fieldIds: s.fields.map((f) => f.id),
  }));

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {form.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              form={form}
              otherSections={form.sections
                .filter((s) => s.id !== section.id)
                .map((s) => ({ id: s.id, title: s.title }))}
              fullLayout={fullLayout}
              canDelete={form.sections.length > 1}
              disabled={disabled}
            />
          ))}
        </SortableContext>
      </DndContext>

      {reorderSections.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {reorderSections.error.message}
        </div>
      )}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={() => addSection.mutate({ formId: form.id })}
          disabled={addSection.isPending}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add section
        </Button>
      )}

      {addSection.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {addSection.error.message}
        </div>
      )}
    </div>
  );
}
