"use client";

import { trpc } from "~/trpc/client";

type Visibility = "public" | "unlisted";

const OPTIONS: Array<{ value: Visibility; label: string; hint: string }> = [
  {
    value: "public",
    label: "Public",
    hint: "Listed in Explore and template galleries. Anyone can find and submit.",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    hint: "Hidden from Explore. Only people with the direct link can submit.",
  },
];

export function VisibilityPicker({
  formId,
  visibility,
  version,
  disabled,
}: {
  formId: string;
  visibility: Visibility | "invite_only";
  version: number;
  disabled?: boolean;
}) {
  const utils = trpc.useUtils();
  const setVisibility = trpc.forms.setVisibility.useMutation({
    onSuccess: () => utils.forms.get.invalidate({ id: formId }),
  });

  const effective: Visibility = visibility === "invite_only" ? "unlisted" : visibility;

  return (
    <div className="p-4 bg-white border border-neutral-200 rounded-lg space-y-2">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Visibility</p>
      <div className="flex gap-2 flex-wrap">
        {OPTIONS.map((opt) => {
          const active = opt.value === effective;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled || setVisibility.isPending}
              onClick={() => {
                if (active) return;
                setVisibility.mutate({ id: formId, visibility: opt.value, version });
              }}
              className={`text-left px-3 py-2 border rounded transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-neutral-900 ring-2 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-neutral-500 mt-0.5 max-w-xs">{opt.hint}</div>
            </button>
          );
        })}
      </div>
      {setVisibility.error && <p className="text-xs text-red-600">{setVisibility.error.message}</p>}
    </div>
  );
}
