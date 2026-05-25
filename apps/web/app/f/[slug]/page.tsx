"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const form = trpc.publicForm.getBySlug.useQuery({ slug });

  const submit = trpc.publicForm.submit.useMutation({
    onSuccess: () => {
      router.push(`/f/${slug}/thanks`);
    },
  });

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

  // Phase 2: no fields to render yet. Submit posts an empty answer set.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate({ slug, answers: [] });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="max-w-xl w-full p-8 bg-white border border-neutral-200 rounded-lg space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{form.data.title}</h1>
          {form.data.description && (
            <p className="text-neutral-600 mt-2">{form.data.description}</p>
          )}
        </header>

        {!isPublished && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
            This form isn&apos;t accepting responses right now.
          </div>
        )}

        {isPublished && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-neutral-500 italic">
              (Phase 2: this form has no fields. Submit posts an empty response to prove the slice
              works end-to-end.)
            </p>

            {submit.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {submit.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full px-4 py-3 bg-neutral-900 text-white rounded-md font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submit.isPending ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
