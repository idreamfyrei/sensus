"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { trpc } from "~/trpc/client";
import { FormRenderer } from "~/components/renderer/form-renderer";
import { ThemedShell } from "~/components/renderer/themed-shell";

export default function PreviewFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const form = trpc.forms.get.useQuery({ id: formId });

  if (form.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <p className="text-neutral-500">Loading preview…</p>
      </main>
    );
  }

  if (form.error) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <Link
            href={`/dashboard/forms/${formId}/edit`}
            className="text-sm text-neutral-600 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to builder
          </Link>
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {form.error.message}
          </div>
        </div>
      </main>
    );
  }

  if (!form.data) return null;

  const formData = form.data;

  return (
    <ThemedShell theme={formData.theme}>
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm flex items-center justify-between"
        style={{
          background: "var(--sensus-primary, #0f172a)",
          color: "var(--sensus-bg, #ffffff)",
        }}
      >
        <span className="font-medium">Preview mode</span>
        <div className="flex items-center gap-3">
          <span className="opacity-80">Submissions are disabled.</span>
          <Link href={`/dashboard/forms/${formId}/edit`} className="underline hover:opacity-80">
            Back to builder
          </Link>
        </div>
      </div>

      <main className="min-h-screen flex items-center justify-center p-8 pt-20">
        <div className="sensus-card max-w-xl w-full p-8 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">{formData.title}</h1>
            {formData.description && <p className="sensus-muted mt-2">{formData.description}</p>}
          </header>
          <FormRenderer form={formData} previewMode />
        </div>
      </main>
    </ThemedShell>
  );
}
