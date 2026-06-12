"use client";

import { Check, Loader2, X } from "lucide-react";
import { trpc } from "~/trpc/client";
import type { ThemePreset } from "~/lib/api-types";

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
  const themeList = themes.data as ThemePreset[] | undefined;

  const setTheme = trpc.forms.setTheme.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate({ id: formId });
      onClose();
    },
  });

  if (themes.isLoading) {
    return (
      <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading themes…
        </p>
      </div>
    );
  }

  if (themes.error || !themeList) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          Could not load themes: {themes.error?.message ?? "unknown error"}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-neutral-200 bg-[#fbfaf7] p-4 shadow-[0_18px_60px_rgba(23,19,14,0.08)] sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
            form atmosphere
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">Choose a theme</h2>
          <p className="max-w-xl text-sm leading-relaxed text-neutral-600">
            Each preset changes typography, color, surface treatment, and public form effects.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close theme picker"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {setTheme.error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {setTheme.error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {themeList.map((theme) => {
          const isCurrent = theme.id === currentThemeId;
          const isPending = setTheme.isPending && setTheme.variables?.themeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              disabled={disabled || setTheme.isPending || isCurrent}
              onClick={() => setTheme.mutate({ id: formId, themeId: theme.id, version })}
              aria-pressed={isCurrent}
              className={`group relative min-h-[190px] overflow-hidden rounded-[24px] border p-2 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75 ${
                isCurrent
                  ? "border-neutral-950 ring-2 ring-neutral-950"
                  : "border-neutral-200 hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-[0_18px_45px_rgba(23,19,14,0.12)]"
              }`}
              style={{
                background: theme.bg,
                color: theme.textColor,
                fontFamily: theme.fontBody,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "radial-gradient(currentColor 1px, transparent 1.5px)",
                  backgroundSize: "18px 18px",
                }}
              />
              <div
                className="relative flex h-full min-h-[174px] flex-col justify-between rounded-[18px] border p-4"
                style={{
                  background: theme.surface,
                  borderColor: theme.muted,
                  borderStyle: theme.borderStyle,
                  borderRadius: theme.borderRadius,
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-1.5" aria-hidden>
                      {[theme.surface, theme.primary, theme.accent, theme.muted].map(
                        (color, index) => (
                          <span
                            key={`${theme.id}-${color}-${index}`}
                            className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                            style={{ background: color }}
                          />
                        ),
                      )}
                    </div>
                    <span
                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-medium ${
                        isCurrent ? "bg-black text-white" : "bg-white/80 text-black/70"
                      }`}
                    >
                      {isCurrent ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        "Try"
                      )}
                    </span>
                  </div>
                  <div>
                    <div
                      className="text-xl leading-none tracking-tight"
                      style={{ fontFamily: theme.fontHeading, color: theme.primary }}
                    >
                      {theme.name}
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs leading-relaxed opacity-80">
                      {theme.description}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-2">
                  <span
                    className="h-2 rounded-full"
                    style={{ background: theme.primary, opacity: 0.9 }}
                    aria-hidden
                  />
                  <span
                    className="h-2 w-2/3 rounded-full"
                    style={{ background: theme.accent, opacity: 0.75 }}
                    aria-hidden
                  />
                </div>
              </div>
              <span className="sr-only">
                {isCurrent ? "Current theme" : isPending ? "Applying theme" : "Select theme"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
