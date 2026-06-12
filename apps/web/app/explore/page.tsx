"use client";

import { trpc } from "~/trpc/client";
import { PublicNav } from "~/components/marketing/public-nav";
import { FormCard } from "~/components/marketing/form-card";
import type { PublicFormSummary } from "~/lib/api-types";

export default function ExplorePage() {
  const forms = trpc.forms.listPublic.useQuery();
  const publicForms = forms.data as PublicFormSummary[] | undefined;

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-neutral-50">
        <header className="max-w-6xl mx-auto px-6 pt-12 pb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
          <p className="text-neutral-600 max-w-2xl">
            Public forms shared by the Sensus community. Open one, fill it out, or take the URL back
            to whoever sent you.
          </p>
        </header>

        <div className="max-w-6xl mx-auto px-6 pb-16">
          {forms.isLoading && <p className="text-neutral-500">Loading…</p>}

          {forms.error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {forms.error.message}
            </div>
          )}

          {publicForms && publicForms.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-lg">
              <p className="text-neutral-500">
                No public forms yet. Once creators publish forms with public visibility,
                they&apos;ll show up here.
              </p>
            </div>
          )}

          {publicForms && publicForms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicForms.map((f) => (
                <FormCard key={f.id} form={f} href={`/f/${f.slug}`} cta="Open form" />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
