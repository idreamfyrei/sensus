"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { FieldType } from "@repo/schemas/fields";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import { TypePicker } from "./type-picker";

export function AddFieldSection({ formId, sectionId }: { formId: string; sectionId: string }) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const add = trpc.fields.add.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate();
      setOpen(false);
    },
  });

  const handlePick = (type: FieldType) => {
    add.mutate({ formId, sectionId, type, label: "Untitled question" });
  };

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add field
      </Button>
    );
  }

  return (
    <div className="p-4 border border-neutral-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Choose a field type</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-neutral-400 hover:text-neutral-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <TypePicker onPick={handlePick} />
      {add.error && <div className="mt-3 text-xs text-red-600">{add.error.message}</div>}
    </div>
  );
}
