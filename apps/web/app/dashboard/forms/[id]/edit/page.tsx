"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FIELD_TYPES_CATALOG } from "@repo/schemas/fields";
import { trpc } from "~/trpc/client";
import { AddFieldSection } from "~/components/builder/add-field-section";
import { FieldCard } from "~/components/builder/field-card";
import { ThemePicker } from "~/components/builder/theme-picker";

export default function EditFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;
  const utils = trpc.useUtils();

  const form = trpc.forms.get.useQuery({ id: formId });

  const publish = trpc.forms.publish.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate({ id: formId });
      utils.forms.list.invalidate();
    },
  });

  const [copied, setCopied] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const themes = trpc.themes.list.useQuery();

  if (form.isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (form.error) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="text-sm text-neutral-600 hover:underline">
            ← Back to dashboard
          </Link>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {form.error.message}
          </div>
        </div>
      </main>
    );
  }

  if (!form.data) return null;

  const formData = form.data;
  const isPublished = formData.status === "published";
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/f/${formData.slug}` : "";

  const section = formData.sections[0];
  const currentTheme = themes.data?.find((t) => t.id === formData.themeId);
  const currentThemeLabel = currentTheme?.name ?? "Default";

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard" className="text-sm text-neutral-600 hover:underline">
          ← Back to dashboard
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold truncate">{formData.title}</h1>
            <p className="text-sm text-neutral-500 mt-1 font-mono">
              status: <span className="text-neutral-900">{formData.status}</span> · version:{" "}
              <span className="text-neutral-900">{formData.version}</span>
            </p>
          </div>

          {!isPublished ? (
            <button
              type="button"
              onClick={() => publish.mutate({ id: formData.id, version: formData.version })}
              disabled={publish.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
            >
              {publish.isPending ? "Publishing…" : "Publish"}
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded font-medium text-sm">
              ✓ Published
            </span>
          )}
        </header>

        {publish.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {publish.error.message}
          </div>
        )}

        <section className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-lg">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Theme</p>
            <p className="font-medium">{currentThemeLabel}</p>
          </div>
          {!isPublished && (
            <button
              type="button"
              onClick={() => setThemePickerOpen((open) => !open)}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded hover:bg-neutral-50 transition"
            >
              {themePickerOpen ? "Close" : "Change theme"}
            </button>
          )}
        </section>

        {themePickerOpen && !isPublished && (
          <ThemePicker
            formId={formData.id}
            currentThemeId={formData.themeId}
            version={formData.version}
            onClose={() => setThemePickerOpen(false)}
          />
        )}

        {isPublished && (
          <section className="p-6 bg-white border border-neutral-200 rounded-lg space-y-3">
            <h2 className="font-medium">Share this form</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-800 transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <Link
              href={`/f/${formData.slug}`}
              target="_blank"
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              Open public form →
            </Link>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="font-medium">Fields</h2>

          {section && section.fields.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
              <p className="text-sm text-neutral-500">
                {isPublished
                  ? "No fields. Respondents see only the title and Submit."
                  : "No fields yet. Click below to add one."}
              </p>
            </div>
          )}

          {section?.fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              hasOptions={FIELD_TYPES_CATALOG[field.type].hasOptions}
            />
          ))}

          {section && !isPublished && (
            <AddFieldSection formId={formData.id} sectionId={section.id} />
          )}
        </section>
      </div>
    </main>
  );
}
