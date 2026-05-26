"use client";

import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { FormRenderer } from "~/components/renderer/form-renderer";
import { ThemedShell } from "~/components/renderer/themed-shell";

type UnavailableReason = "not_found" | "not_published" | "archived" | "rate_limited" | "unknown";

function reasonFor(code: string | undefined): UnavailableReason {
  switch (code) {
    case "NOT_FOUND":
      return "not_found";
    case "BAD_REQUEST":
      return "not_published";
    case "TOO_MANY_REQUESTS":
      return "rate_limited";
    default:
      return "unknown";
  }
}

function copyFor(reason: UnavailableReason, fallback: string): { title: string; body: string } {
  switch (reason) {
    case "not_found":
      return {
        title: "Form not found",
        body: "The link you followed doesn't lead to a form. Check the URL or ask the creator for an updated link.",
      };
    case "not_published":
      return {
        title: "Form unavailable",
        body: "This form isn't accepting responses right now. The creator may have unpublished it or it's still a draft.",
      };
    case "archived":
      return {
        title: "Form archived",
        body: "The creator has archived this form. It can be restored, but it isn't accepting responses today.",
      };
    case "rate_limited":
      return {
        title: "Slow down",
        body: "Too many requests from this connection. Try again in a minute.",
      };
    default:
      return { title: "Form unavailable", body: fallback };
  }
}

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const form = trpc.publicForm.getBySlug.useQuery({ slug }, { retry: false });

  if (form.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (form.error) {
    const reason = reasonFor(form.error.data?.code);
    const { title, body } = copyFor(reason, form.error.message);
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
        <div className="max-w-md w-full p-6 bg-white border border-neutral-200 rounded-lg text-center space-y-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-neutral-600 text-sm">{body}</p>
        </div>
      </main>
    );
  }

  if (!form.data) return null;

  return (
    <ThemedShell theme={form.data.theme}>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="sensus-card max-w-xl w-full p-8 space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">{form.data.title}</h1>
            {form.data.description && <p className="sensus-muted mt-2">{form.data.description}</p>}
          </header>
          <FormRenderer form={form.data} />
        </div>
      </main>
    </ThemedShell>
  );
}
