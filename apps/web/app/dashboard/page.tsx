"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { trpc } from "~/trpc/client";
import type { FormSummary } from "~/lib/api-types";

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session } = authClient.useSession();

  const formsList = trpc.forms.list.useQuery();
  const forms = formsList.data as FormSummary[] | undefined;

  const createForm = trpc.forms.create.useMutation({
    onSuccess: (form) => {
      utils.forms.list.invalidate();
      router.push(`/dashboard/forms/${form.id}/edit`);
    },
  });

  const handleNewForm = () => {
    createForm.mutate({ title: "Untitled form" });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const deleteAccount = trpc.account.deleteSelf.useMutation({
    onSuccess: async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    },
  });

  const handleDeleteAccount = () => {
    const ok = window.confirm(
      "Delete your account?\n\nYour forms and responses will be retained for 30 days, then permanently purged. This cannot be undone.",
    );
    if (ok) deleteAccount.mutate();
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">My Forms</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {session?.user.name ?? session?.user.email ?? "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={handleNewForm}
              disabled={createForm.isPending}
              className="px-4 py-2 bg-neutral-900 text-white rounded-md font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {createForm.isPending ? "Creating…" : "+ New form"}
            </button>
          </div>
        </header>

        {createForm.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {createForm.error.message}
          </div>
        )}

        {formsList.isLoading && <p className="text-neutral-500">Loading…</p>}

        {formsList.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            Failed to load forms: {formsList.error.message}
          </div>
        )}

        {forms && forms.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-lg">
            <p className="text-neutral-500 mb-3">No forms yet.</p>
            <p className="text-sm text-neutral-400">
              Click &quot;+ New form&quot; to create your first one.
            </p>
          </div>
        )}

        {forms && forms.length > 0 && (
          <ul className="space-y-2">
            {forms.map((form) => (
              <li
                key={form.id}
                className="border border-neutral-200 bg-white rounded-lg p-4 flex items-center justify-between hover:border-neutral-400 transition"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/forms/${form.id}/edit`}
                    className="font-medium hover:underline block truncate"
                  >
                    {form.title}
                  </Link>
                  <p className="text-xs text-neutral-500 mt-1 font-mono truncate">/f/{form.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded font-medium bg-neutral-100 text-neutral-700 capitalize">
                    {form.visibility === "invite_only" ? "unlisted" : form.visibility}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      form.status === "published"
                        ? "bg-green-100 text-green-700"
                        : form.status === "unpublished"
                          ? "bg-amber-100 text-amber-700"
                          : form.status === "archived"
                            ? "bg-neutral-200 text-neutral-600"
                            : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-16 pt-8 border-t border-neutral-200">
          <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
          <p className="text-xs text-neutral-500 mt-1 mb-3">
            Forms and responses are retained for 30 days, then permanently purged.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteAccount.isPending}
            className="px-3 py-2 text-sm border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {deleteAccount.isPending ? "Deleting…" : "Delete account"}
          </button>
        </section>
      </div>
    </main>
  );
}
