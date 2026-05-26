"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { trpc } from "~/trpc/client";

export default function FormResponsesPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const form = trpc.forms.get.useQuery({ id: formId });
  const responses = trpc.responses.list.useQuery({ formId });
  const csv = trpc.responses.exportCsv.useQuery({ formId }, { enabled: false });

  const downloadCsv = async () => {
    const result = await csv.refetch();
    if (!result.data?.csv) return;
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.data?.slug ?? formId}-responses.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (form.isLoading || responses.isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (form.error || !form.data) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-600 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {form.error?.message ?? "Form not found"}
          </div>
        </div>
      </main>
    );
  }

  const formData = form.data;
  const allFields = formData.sections.flatMap((s) => s.fields);
  const rows = responses.data?.responses ?? [];
  const total = responses.data?.total ?? 0;

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={`/dashboard/forms/${formId}/edit`}
          className="text-sm text-neutral-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>

        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{formData.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {total} response{total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/forms/${formId}/analytics`}
              className="px-3 py-2 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
            >
              View analytics
            </Link>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={total === 0 || csv.isFetching}
              className="px-3 py-2 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              {csv.isFetching ? "Building…" : "Download CSV"}
            </button>
          </div>
        </header>

        {total === 0 ? (
          <div className="p-12 bg-white border border-dashed border-neutral-200 rounded-lg text-center">
            <p className="text-neutral-500 text-sm">
              No responses yet. Share the form link to start collecting.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left p-3 font-medium text-neutral-700 whitespace-nowrap">
                    Submitted
                  </th>
                  {allFields.map((f) => (
                    <th
                      key={f.id}
                      className="text-left p-3 font-medium text-neutral-700 whitespace-nowrap"
                    >
                      {f.label || "Untitled"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => {
                  const byField = new Map(r.answers.map((a) => [a.formFieldId, a]));
                  return (
                    <tr key={r.id} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-600 whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleString()}
                      </td>
                      {allFields.map((f) => {
                        const ans = byField.get(f.id);
                        let display = "";
                        if (ans?.valueText !== null && ans?.valueText !== undefined) {
                          display = ans.valueText;
                        } else if (Array.isArray(ans?.valueJson)) {
                          display = ans.valueJson.map((v) => String(v)).join(", ");
                        } else if (ans?.valueJson !== null && ans?.valueJson !== undefined) {
                          display = JSON.stringify(ans.valueJson);
                        }
                        return (
                          <td key={f.id} className="p-3 text-neutral-800 max-w-xs truncate">
                            {display || <span className="text-neutral-400">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
