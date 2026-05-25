import Link from "next/link";
import { api } from "~/trpc/server";

// Don't statically prerender — the tRPC health probe needs the api server.
export const dynamic = "force-dynamic";

export default async function Home() {
  let apiStatus = "unavailable";
  try {
    const result = await api.health.getHealth.query();
    apiStatus = result.status;
  } catch {
    // api unreachable; fall through to the "unavailable" fallback.
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Sensus</h1>
        <p className="text-neutral-600">
          Build dynamic forms, publish shareable links, collect responses.
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/dashboard"
            className="inline-block w-full px-5 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition"
          >
            Go to dashboard →
          </Link>
        </div>

        <p className="text-xs text-neutral-400 pt-6">
          API status: <span className="font-mono">{apiStatus}</span>
        </p>
      </div>
    </main>
  );
}
