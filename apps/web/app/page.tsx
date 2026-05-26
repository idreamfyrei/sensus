import Link from "next/link";
import { PublicNav } from "~/components/marketing/public-nav";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Dynamic schema",
    body: "Ten field types, per-field validation, conditional show/hide/require/jump rules. Forms are real schemas, not just questions.",
  },
  {
    title: "Drag-reorder builder",
    body: "Sections, fields, layouts. One-per-screen or single-page. Preview before publish.",
  },
  {
    title: "Page-wide themes",
    body: "Ten hand-tuned themes that recolor the whole respondent flow — bg, surface, typography, effects.",
  },
  {
    title: "Public, unlisted, link-only",
    body: "Public forms surface in Explore. Unlisted forms stay private to anyone with the link. Submit without an account.",
  },
  {
    title: "Live analytics",
    body: "Views, responses, completion rate, per-option distributions. Charts that move when responses land.",
  },
  {
    title: "Type-safe everywhere",
    body: "Turborepo + tRPC + Zod + Drizzle. One Zod schema validates client and server. No untyped wire.",
  },
];

const THEME_STRIP: Array<{
  key: string;
  bg: string;
  primary: string;
  accent: string;
  name: string;
}> = [
  { key: "pixel", bg: "#1a1a2e", primary: "#f8e71c", accent: "#e94560", name: "Pixel" },
  { key: "glitch", bg: "#0d0d12", primary: "#ff00aa", accent: "#00ffd5", name: "Glitch" },
  { key: "terminal", bg: "#000000", primary: "#33ff66", accent: "#a3ffb3", name: "Terminal" },
  { key: "brutalist", bg: "#f4f4f4", primary: "#000000", accent: "#ff3b1f", name: "Brutalist" },
  {
    key: "glassmorphism",
    bg: "linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)",
    primary: "#1e3a8a",
    accent: "#7c3aed",
    name: "Glassmorphism",
  },
  { key: "bauhaus", bg: "#f5f1e8", primary: "#d62828", accent: "#003049", name: "Bauhaus" },
  { key: "museum", bg: "#faf7f2", primary: "#2c2418", accent: "#8b6f47", name: "Museum" },
  {
    key: "vaporwave",
    bg: "linear-gradient(135deg, #ff71ce 0%, #01cdfe 100%)",
    primary: "#ff71ce",
    accent: "#05ffa1",
    name: "Vaporwave",
  },
  { key: "nature_minimal", bg: "#f4f1ea", primary: "#3a5a40", accent: "#a3b18a", name: "Nature" },
  { key: "anime", bg: "#fff8e7", primary: "#1a1a1a", accent: "#e63946", name: "Anime" },
];

export default function Home() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-neutral-50">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
            Forms that feel like a product, <br className="hidden sm:inline" />
            not a Google Doc.
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Sensus is a form builder for creators who care how the form looks and behaves.
            Conditional logic, page-wide themes, multi-screen flows, and submission without an
            account.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/sign-up"
              className="px-5 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition"
            >
              Start building
            </Link>
            <Link
              href="/explore"
              className="px-5 py-3 border border-neutral-300 rounded-lg font-medium hover:bg-white transition"
            >
              See examples
            </Link>
          </div>
        </section>

        {/* Theme strip */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-xs uppercase tracking-wider text-neutral-500 text-center mb-6">
            Ten themes. Every theme paints the whole respondent flow.
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {THEME_STRIP.map((t) => (
              <div
                key={t.key}
                className="rounded-lg p-4 h-32 flex flex-col justify-between border border-neutral-200"
                style={{ background: t.bg }}
              >
                <div className="flex gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
                </div>
                <p className="text-sm font-medium" style={{ color: t.primary }}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-center mb-12">
            Built for forms that need to ship.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 bg-white border border-neutral-200 rounded-lg">
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ship your first form in five minutes.
          </h2>
          <p className="text-neutral-600">Free during the public beta. No credit card needed.</p>
          <Link
            href="/sign-up"
            className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition"
          >
            Create an account →
          </Link>
        </section>

        <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
          Sensus · Built with Turborepo · tRPC · Zod · Drizzle · Scalar
        </footer>
      </main>
    </>
  );
}
