"use client";

import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { FormRenderer } from "~/components/renderer/form-renderer";
import { ThemedShell } from "~/components/renderer/themed-shell";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const form = trpc.publicForm.getBySlug.useQuery({ slug });

  if (form.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (form.error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <div className="max-w-md w-full p-6 bg-white border border-neutral-200 rounded-lg text-center">
          <h1 className="text-xl font-semibold mb-2">Form unavailable</h1>
          <p className="text-neutral-600">
            {form.error.data?.code === "NOT_FOUND"
              ? "This form doesn't exist."
              : form.error.message}
          </p>
        </div>
      </main>
    );
  }

  if (!form.data) return null;

  const isPublished = form.data.status === "published";

  return (
    <ThemedShell theme={form.data.theme}>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="sensus-card max-w-xl w-full p-8 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">{form.data.title}</h1>
            {form.data.description && <p className="sensus-muted mt-2">{form.data.description}</p>}
          </header>

          {!isPublished ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
              This form isn&apos;t accepting responses right now.
            </div>
          ) : (
            <FormRenderer form={form.data} />
          )}
        </div>
      </main>
    </ThemedShell>
  );
}
