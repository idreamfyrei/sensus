"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { trpc } from "~/trpc/client";
import { PublicNav } from "~/components/marketing/public-nav";
import { FormCard } from "~/components/marketing/form-card";
import { Button } from "~/components/ui/button";
import type { PublicFormSummary } from "~/lib/api-types";

export default function TemplatesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session } = authClient.useSession();
  const templates = trpc.forms.listTemplates.useQuery();
  const templateForms = templates.data as PublicFormSummary[] | undefined;
  const clone = trpc.forms.cloneTemplate.useMutation({
    onSuccess: (newForm) => {
      utils.forms.list.invalidate();
      router.push(`/dashboard/forms/${newForm.id}/edit`);
    },
  });

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-neutral-50">
        <header className="max-w-6xl mx-auto px-6 pt-12 pb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
          <p className="text-neutral-600 max-w-2xl">
            Start from a curated example. Click <em>Use template</em> to clone it into your
            dashboard, keep the schema and theme, then customize the questions.
          </p>
        </header>

        <div className="max-w-6xl mx-auto px-6 pb-16">
          {templates.isLoading && <p className="text-neutral-500">Loading…</p>}

          {templates.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {templates.error.message}
            </div>
          )}

          {templateForms && templateForms.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-lg">
              <p className="text-neutral-500">
                No templates yet. Templates show up here once a creator flags a published, public
                form as one.
              </p>
            </div>
          )}

          {clone.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm mb-4">
              {clone.error.message}
            </div>
          )}

          {templateForms && templateForms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateForms.map((f) => (
                <FormCard
                  key={f.id}
                  form={f}
                  href={`/f/${f.slug}`}
                  cta="Preview"
                  footer={
                    session?.user ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => clone.mutate({ templateId: f.id })}
                        disabled={clone.isPending}
                      >
                        {clone.isPending && clone.variables?.templateId === f.id
                          ? "Cloning…"
                          : "Use template"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/sign-in")}
                      >
                        Sign in to use
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
