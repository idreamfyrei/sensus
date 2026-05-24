import { api } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  let status = "unavailable";
  try {
    const result = await api.health.getHealth.query();
    status = result.status;
  } catch {
    // api unreachable; fall through to the "unavailable" fallback above.
  }
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">Hello World</h1>
        <h2>Server Status: {status}</h2>
      </div>
    </main>
  );
}
