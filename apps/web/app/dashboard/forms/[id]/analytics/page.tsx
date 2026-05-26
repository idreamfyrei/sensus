"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "~/trpc/client";

export default function FormAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const form = trpc.forms.get.useQuery({ id: formId });
  const summary = trpc.analytics.summary.useQuery({ formId });

  if (form.isLoading || summary.isLoading) {
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

  const s = summary.data;

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={`/dashboard/forms/${formId}/edit`}
          className="text-sm text-neutral-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{form.data.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">Last 30 days</p>
          </div>
          <Link
            href={`/dashboard/forms/${formId}/responses`}
            className="px-3 py-2 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
          >
            View responses
          </Link>
        </header>

        {!s ? (
          <p className="text-neutral-500 text-sm">{summary.error?.message ?? "No data yet."}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Views" value={s.totalViews} />
              <StatCard label="Responses" value={s.totalSubmits} />
              <StatCard label="Completion rate" value={`${Math.round(s.completionRate * 100)}%`} />
            </div>

            <ChartCard title="Views per day">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={s.viewsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" fontSize={11} stroke="#737373" />
                  <YAxis allowDecimals={false} fontSize={11} stroke="#737373" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Responses per day">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={s.submitsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" fontSize={11} stroke="#737373" />
                  <YAxis allowDecimals={false} fontSize={11} stroke="#737373" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {s.optionDistributions.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-medium">Per-field breakdown</h2>
                {s.optionDistributions.map((dist) => (
                  <ChartCard key={dist.fieldId} title={dist.fieldLabel}>
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(150, dist.buckets.length * 30)}
                    >
                      <BarChart data={dist.buckets} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#737373" />
                        <YAxis
                          type="category"
                          dataKey="value"
                          width={120}
                          fontSize={11}
                          stroke="#737373"
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-white border border-neutral-200 rounded-lg">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-white border border-neutral-200 rounded-lg space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}
