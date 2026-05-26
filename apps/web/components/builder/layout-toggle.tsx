"use client";

import { trpc } from "~/trpc/client";

type Layout = "one_per_screen" | "single_page";

const OPTIONS: Array<{ value: Layout; label: string; hint: string }> = [
  {
    value: "one_per_screen",
    label: "One per screen",
    hint: "Focused. Respondents see one question at a time and move with Next.",
  },
  {
    value: "single_page",
    label: "Single page",
    hint: "Scrollable. All questions on one page, optionally split with page breaks.",
  },
];

export function LayoutToggle({
  formId,
  layout,
  version,
  disabled,
}: {
  formId: string;
  layout: Layout;
  version: number;
  disabled?: boolean;
}) {
  const utils = trpc.useUtils();
  const setLayout = trpc.forms.setLayout.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });

  return (
    <div className="p-4 bg-white border border-neutral-200 rounded-lg space-y-2">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Layout</p>
      <div className="flex gap-2 flex-wrap">
        {OPTIONS.map((opt) => {
          const active = opt.value === layout;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled || setLayout.isPending}
              onClick={() => {
                if (active) return;
                setLayout.mutate({ id: formId, layout: opt.value, version });
              }}
              className={`text-left px-3 py-2 border rounded transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-neutral-900 ring-2 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{opt.hint}</div>
            </button>
          );
        })}
      </div>
      {setLayout.error && <p className="text-xs text-red-600">{setLayout.error.message}</p>}
    </div>
  );
}
