"use client";

import { trpc } from "~/trpc/client";

type ThemePickerProps = {
  formId: string;
  currentThemeId: string;
  version: number;
  disabled?: boolean;
  onClose: () => void;
};

export function ThemePicker({
  formId,
  currentThemeId,
  version,
  disabled,
  onClose,
}: ThemePickerProps) {
  const utils = trpc.useUtils();
  const themes = trpc.themes.list.useQuery();

  const setTheme = trpc.forms.setTheme.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate({ id: formId });
      onClose();
    },
  });

  if (themes.isLoading) {
    return (
      <div className="p-6 bg-white border border-neutral-200 rounded-lg">
        <p className="text-sm text-neutral-500">Loading themes…</p>
      </div>
    );
  }

  if (themes.error || !themes.data) {
    return (
      <div className="p-6 bg-white border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">
          Could not load themes: {themes.error?.message ?? "unknown error"}
        </p>
      </div>
    );
  }

  return (
    <section className="p-6 bg-white border border-neutral-200 rounded-lg space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="font-medium">Choose a theme</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-neutral-600 hover:underline"
        >
          Close
        </button>
      </header>

      {setTheme.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {setTheme.error.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {themes.data.map((theme) => {
          const isCurrent = theme.id === currentThemeId;
          const isPending = setTheme.isPending && setTheme.variables?.themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              disabled={disabled || setTheme.isPending || isCurrent}
              onClick={() => setTheme.mutate({ id: formId, themeId: theme.id, version })}
              className={`text-left p-3 rounded-lg border transition disabled:cursor-not-allowed ${
                isCurrent
                  ? "border-neutral-900 ring-2 ring-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
              style={{
                background: theme.bg,
                color: theme.textColor,
                fontFamily: theme.fontBody,
              }}
            >
              <div className="flex gap-1 mb-2">
                <span
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ background: theme.surface }}
                  aria-hidden
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ background: theme.primary }}
                  aria-hidden
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ background: theme.accent }}
                  aria-hidden
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/10"
                  style={{ background: theme.muted }}
                  aria-hidden
                />
              </div>
              <div
                className="text-base leading-tight"
                style={{ fontFamily: theme.fontHeading, color: theme.primary }}
              >
                {theme.name}
              </div>
              <div className="text-xs opacity-80 mt-1 line-clamp-2">{theme.description}</div>
              <div className="text-xs mt-2 opacity-70">
                {isCurrent ? "✓ Current" : isPending ? "Applying…" : "Select"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
