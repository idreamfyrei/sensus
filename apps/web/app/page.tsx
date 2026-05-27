import Link from "next/link";
import { PublicNav } from "~/components/marketing/public-nav";
import { FeatureDeck } from "~/components/marketing/feature-deck";
import { MarkFooter } from "~/components/marketing/mark-footer";
import { HeroForm } from "~/components/marketing/hero-form";

export const dynamic = "force-dynamic";

const SERIF = "var(--font-fraunces), Georgia, serif";

export default function Home() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-[#faf8f3] text-neutral-900 overflow-x-hidden">
        <HeroForm />

        <section className="bg-[#0e0e0e] py-28 sm:py-40 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(rgba(242, 234, 216, 0.7) 1px, transparent 1.5px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <EyebrowDark>what&apos;s inside</EyebrowDark>
              <h2
                className="mt-5 text-4xl sm:text-5xl leading-[1.05] text-[#f2ead8]"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                Five small ideas.
                <br />
                One form they <em className="italic">remember</em>.
              </h2>
              <p className="mt-5 text-[#f2ead8]/55 text-base">
                Tap a card. Each one is a real piece of the product.
              </p>
            </div>
            <FeatureDeck />
          </div>
        </section>

        <Bento />
        <FinalCTA />
        <MarkFooter />
      </main>
    </>
  );
}

function Bento() {
  return (
    <section className="px-6 py-28 sm:py-40">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <Eyebrow>one form, a hundred rooms</Eyebrow>
            <h2
              className="mt-5 text-4xl sm:text-6xl leading-[1.02] tracking-tight"
              style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.02em" }}
            >
              The same tool.
              <br />
              <em className="italic">Very</em> different rooms.
            </h2>
          </div>
          <p className="text-sm text-neutral-600 max-w-xs">
            A few of the rooms people have built, and the quiet machinery underneath.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4 auto-rows-[150px]">
          <BentoCell className="sm:col-span-4 sm:row-span-2 bg-[#0e0e0e] text-[#f2ead8]">
            <div className="relative flex h-full flex-col justify-between p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <Eyebrow tone="dark">no wall</Eyebrow>
                <span className="text-[10px] tracking-[0.22em] uppercase text-[#f2ead8]/40">
                  0 clicks to start
                </span>
              </div>
              <h3
                className="text-3xl sm:text-5xl leading-[1.02] tracking-tight max-w-md"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                No login.
                <br />
                No friction. Just the form.
              </h3>
              <p className="text-sm text-[#f2ead8]/65 max-w-md leading-relaxed">
                People open the link and the form is right there. No sign ups, no passwords, nothing
                in the way of an honest answer.
              </p>
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "radial-gradient(rgba(242, 234, 216, 0.9) 1px, transparent 1.4px)",
                backgroundSize: "26px 26px",
              }}
            />
          </BentoCell>

          <UseCaseCell
            className="sm:col-span-2 sm:row-span-2"
            bg="#D85A28"
            ink="#FFF4D6"
            label="Wedding RSVPs"
            count="312 finished"
            pattern="stripes-v"
            size="lg"
          />

          {/* Row 2 (h=2): public + live */}
          <BentoCell className="sm:col-span-2 sm:row-span-2 bg-[#F2EAD8] text-[#3D2E1A]">
            <div className="relative flex h-full flex-col justify-between p-7">
              <Eyebrow>your call</Eyebrow>
              <h3
                className="text-3xl leading-[1.05] tracking-tight"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                Public,
                <br />
                or only <em className="italic">yours</em>.
              </h3>
              <p className="text-[13px] text-[#3D2E1A]/75 leading-relaxed">
                On the wall, or quiet in a DM. Change your mind any time.
              </p>
            </div>
          </BentoCell>

          <BentoCell className="sm:col-span-4 sm:row-span-2 bg-white ring-1 ring-black/[0.05] text-neutral-900">
            <div className="flex h-full flex-col justify-between p-7 sm:p-9">
              <div className="flex items-start justify-between">
                <Eyebrow>full view</Eyebrow>
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-neutral-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5DBA85] animate-pulse" />
                  live
                </span>
              </div>
              <h3
                className="text-3xl sm:text-4xl leading-[1.05] tracking-tight max-w-md"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                You see every answer
                <br />
                as it lands.
              </h3>
              <LiveStrip />
            </div>
          </BentoCell>

          {/* Row 3 (h=1): three equal chips */}
          <UseCaseCell
            className="sm:col-span-2 sm:row-span-1"
            bg="#1B5BA8"
            ink="#D4F0FF"
            label="Reading Clubs"
            count="64 rooms"
            pattern="dots"
          />
          <UseCaseCell
            className="sm:col-span-2 sm:row-span-1"
            bg="#5DBA85"
            ink="#0F3D1F"
            label="Movie Ballots"
            count="29 finished"
            pattern="halftone"
          />
          <UseCaseCell
            className="sm:col-span-2 sm:row-span-1"
            bg="#1A1A1A"
            ink="#F2EAD8"
            label="Quiet Feedback"
            count="real time"
            pattern="stripes-h"
          />
        </div>
      </div>
    </section>
  );
}

function BentoCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-[24px] overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${className}`}
    >
      {children}
    </div>
  );
}

function UseCaseCell({
  className,
  bg,
  ink,
  label,
  count,
  pattern,
  size = "md",
}: {
  className: string;
  bg: string;
  ink: string;
  label: string;
  count: string;
  pattern: "stripes-v" | "stripes-h" | "dots" | "halftone";
  size?: "md" | "lg";
}) {
  return (
    <div
      className={`group relative rounded-[24px] overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${className}`}
      style={{
        background: bg,
        color: ink,
        boxShadow: "0 12px 28px -16px rgba(0,0,0,0.35)",
      }}
    >
      <div aria-hidden className="absolute inset-0" style={patternStyle(pattern, ink)} />
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* solid badge for legibility over patterns */}
        <span
          className="inline-flex self-start items-center rounded-full px-2.5 py-1 text-[10px] tracking-[0.22em] uppercase font-medium"
          style={{ background: ink, color: bg }}
        >
          {count}
        </span>
        <div className="flex items-end justify-between gap-3">
          <span
            className={`leading-[1.05] tracking-tight ${size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl"}`}
            style={{ fontFamily: SERIF, fontWeight: 500, color: ink }}
          >
            {label}
          </span>
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ background: ink, color: bg }}
            aria-hidden
          >
            <ArrowIcon className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function patternStyle(
  pattern: "stripes-v" | "stripes-h" | "dots" | "halftone",
  fg: string,
): React.CSSProperties {
  switch (pattern) {
    case "stripes-v":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 10px)`,
        opacity: 0.4,
      };
    case "stripes-h":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 8px)`,
        opacity: 0.3,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(${fg} 1.4px, transparent 2px)`,
        backgroundSize: "12px 12px",
        opacity: 0.35,
      };
    case "halftone":
      return {
        backgroundImage: `radial-gradient(${fg} 1.8px, transparent 2.6px)`,
        backgroundSize: "14px 14px",
        opacity: 0.28,
      };
  }
}

function LiveStrip() {
  const rows = [
    { who: "anon · just now", said: "yes, with a plus one", tone: "#5DBA85" },
    { who: "mara · 12s", said: "maybe, depends on saturday", tone: "#D85A28" },
    { who: "anon · 41s", said: "wouldn't miss it", tone: "#1B5BA8" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.who}
          className="flex items-center gap-3 rounded-xl bg-neutral-50 ring-1 ring-black/[0.04] px-3 py-2.5"
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.tone }} />
          <span className="text-[11px] tracking-[0.18em] uppercase text-neutral-500 w-32 shrink-0">
            {r.who}
          </span>
          <span className="text-sm text-neutral-800 truncate" style={{ fontFamily: SERIF }}>
            {r.said}
          </span>
        </div>
      ))}
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 pb-32 sm:pb-40">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-[2.5rem] bg-black/[0.04] ring-1 ring-black/5 p-2">
          <div className="relative rounded-[calc(2.5rem-0.5rem)] bg-[#0e0e0e] text-[#f2ead8] overflow-hidden">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "radial-gradient(rgba(242, 234, 216, 0.9) 1px, transparent 1.4px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative px-8 py-20 sm:px-16 sm:py-28 text-center">
              <EyebrowDark>your turn</EyebrowDark>
              <h2
                className="mt-6 text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.0] tracking-tight"
                style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.02em" }}
              >
                Your next form could
                <br />
                feel <em className="italic">a lot</em> better.
              </h2>
              <p className="mt-7 text-[#f2ead8]/65 text-lg max-w-xl mx-auto">
                Start one in under a minute. Keep it as long as you want. Free while we&apos;re
                young.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <PrimaryCTA href="/sign-up" inverted>
                  Make a form
                </PrimaryCTA>
                <GhostCTA href="/templates" inverted>
                  Start from a template
                </GhostCTA>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const cls =
    tone === "dark"
      ? "bg-[#f2ead8]/10 text-[#f2ead8]/70 ring-[#f2ead8]/15"
      : "bg-black/[0.04] text-neutral-600 ring-black/[0.06]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium ring-1 ${cls}`}
    >
      {children}
    </span>
  );
}

function EyebrowDark({ children }: { children: React.ReactNode }) {
  return <Eyebrow tone="dark">{children}</Eyebrow>;
}

function PrimaryCTA({
  href,
  children,
  inverted,
}: {
  href: string;
  children: React.ReactNode;
  inverted?: boolean;
}) {
  const base = inverted
    ? "bg-[#f2ead8] text-[#0e0e0e] hover:bg-white"
    : "bg-neutral-900 text-[#faf8f3] hover:bg-neutral-800";
  const inner = inverted ? "bg-[#0e0e0e]/10 text-[#0e0e0e]" : "bg-white/15 text-[#faf8f3]";
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full pl-6 pr-2 py-2 font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] ${base}`}
    >
      <span>{children}</span>
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] ${inner}`}
      >
        <ArrowIcon className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function GhostCTA({
  href,
  children,
  inverted,
}: {
  href: string;
  children: React.ReactNode;
  inverted?: boolean;
}) {
  const cls = inverted
    ? "border-[#f2ead8]/25 text-[#f2ead8] hover:bg-[#f2ead8]/5"
    : "border-neutral-900/15 text-neutral-900 hover:bg-white";
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full border px-6 py-3 font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${cls}`}
    >
      {children}
    </Link>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
