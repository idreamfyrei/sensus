"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";

type Draft = { label: string; value: string };

export function OptionsEditor({
  fieldId,
  initialOptions,
}: {
  fieldId: string;
  initialOptions: Array<{ label: string; value: string }>;
}) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<Draft[]>(
    initialOptions.map((o) => ({ label: o.label, value: o.value })),
  );

  const setOptions = trpc.fields.setOptions.useMutation({
    onSuccess: () => utils.forms.get.invalidate(),
  });

  const save = (next: Draft[] = draft) => {
    const nonEmpty = next.filter((o) => o.label.length > 0 && o.value.length > 0);
    setOptions.mutate({ fieldId, options: nonEmpty });
  };

  const updateOption = (i: number, k: "label" | "value", v: string) => {
    setDraft((d) => d.map((o, idx) => (idx === i ? { ...o, [k]: v } : o)));
  };

  const addOption = () => setDraft((d) => [...d, { label: "", value: "" }]);

  const removeOption = (i: number) => {
    const next = draft.filter((_, idx) => idx !== i);
    setDraft(next);
    save(next);
  };

  return (
    <div className="space-y-2 mt-3 pl-7">
      <div className="text-xs font-medium text-neutral-600">Options</div>
      {draft.map((opt, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Label"
            value={opt.label}
            onChange={(e) => updateOption(i, "label", e.target.value)}
            onBlur={() => save()}
            className="text-sm h-8"
          />
          <Input
            placeholder="Value"
            value={opt.value}
            onChange={(e) => updateOption(i, "value", e.target.value)}
            onBlur={() => save()}
            className="text-sm h-8 font-mono"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOption(i)}
            className="text-red-600 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addOption}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add option
      </Button>
      {setOptions.error && <div className="text-xs text-red-600">{setOptions.error.message}</div>}
    </div>
  );
}
