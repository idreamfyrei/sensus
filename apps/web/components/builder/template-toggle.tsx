"use client";

import { trpc } from "~/trpc/client";

export function TemplateToggle({ formId, isTemplate }: { formId: string; isTemplate: boolean }) {
  const utils = trpc.useUtils();
  const setTemplate = trpc.forms.setTemplate.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });

  return (
    <section className="p-4 bg-white border border-neutral-200 rounded-lg flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">Template</p>
        <p className="font-medium mt-0.5">
          {isTemplate ? "Listed in /templates" : "Not a template"}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5 max-w-md">
          Flagging a form as a template shows it in /templates so other creators can clone it into
          their dashboards. Only works on public, published forms.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setTemplate.mutate({ id: formId, isTemplate: !isTemplate })}
        disabled={setTemplate.isPending}
        className={`px-3 py-1.5 text-sm rounded border transition disabled:opacity-50 disabled:cursor-not-allowed ${
          isTemplate
            ? "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
            : "border-neutral-300 hover:bg-neutral-50"
        }`}
      >
        {setTemplate.isPending ? "Saving…" : isTemplate ? "Unlist as template" : "List as template"}
      </button>
    </section>
  );
}
