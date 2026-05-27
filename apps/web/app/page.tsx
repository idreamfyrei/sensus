import Link from "next/link";
import { PublicNav } from "~/components/marketing/public-nav";
import { FeatureDeck } from "~/components/marketing/feature-deck";
import { HandCrowd } from "~/components/marketing/hand-crowd";
import { MarkFooter } from "~/components/marketing/mark-footer";

export const dynamic = "force-dynamic";

const SERIF = "var(--font-fraunces), Georgia, serif";

export default function Home() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-[#faf8f3] text-neutral-900">
        {/* HERO */}
        <section className="relative px-6 pt-20 pb-0 sm:pt-28">
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-8">
              forms with a feeling
            </p>

            <h1
              className="text-5xl sm:text-7xl leading-[1.02] tracking-tight"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              Forms people
              <br />
              <em className="italic">actually</em> finish.
            </h1>

            <p className="mt-7 text-lg sm:text-xl text-neutral-700 max-w-xl leading-relaxed">
              Pick a feeling. Write your questions. Send the link. Sensus makes the kind of form
              people answer, instead of skim and skip.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="px-7 py-3.5 bg-neutral-900 text-[#faf8f3] rounded-full font-medium hover:bg-neutral-800 transition"
              >
                Start your first form
              </Link>
              <Link
                href="/explore"
                className="px-7 py-3.5 border border-neutral-900/20 rounded-full font-medium hover:bg-white transition"
              >
                See ones people made
              </Link>
            </div>

            <p className="mt-7 text-xs text-neutral-500">
              free while we&apos;re young. no card, no nonsense.
            </p>
          </div>

          {/* hand crowd, anchored to the bottom of the hero band */}
          <div className="relative max-w-7xl mx-auto mt-16 sm:mt-20">
            <span
              aria-hidden
              className="hidden lg:block absolute -top-2 left-2 select-none pointer-events-none"
              style={{
                fontFamily: SERIF,
                fontSize: 14,
                color: "rgba(20, 20, 20, 0.35)",
                fontStyle: "italic",
              }}
            >
              raise your hand, be counted
            </span>
            <HandCrowd height={170} />
          </div>
        </section>

        {/* DECK */}
        <section className="bg-[#0e0e0e] py-24 sm:py-32 relative overflow-hidden">
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
              <p className="text-xs tracking-[0.3em] uppercase text-[#f2ead8]/40 mb-5">
                what&apos;s inside
              </p>
              <h2
                className="text-4xl sm:text-5xl leading-tight text-[#f2ead8]"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                Five small ideas. One form they remember.
              </h2>
              <p className="mt-4 text-[#f2ead8]/60 text-base">
                Tap a card. Each one is a real piece of the product.
              </p>
            </div>
            <FeatureDeck />
          </div>
        </section>

        {/* QUIET TRIO */}
        <section className="max-w-5xl mx-auto px-6 py-28 sm:py-36">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-14">
            <Pillar
              eyebrow="no wall"
              headline={
                <>
                  No login,
                  <br />
                  no friction.
                </>
              }
              body="People open the link, the form is right there. No sign ups, no passwords, nothing in the way."
            />
            <Pillar
              eyebrow="your call"
              headline={
                <>
                  Public,
                  <br />
                  or only yours.
                </>
              }
              body="Show it on the wall, or pass it quietly in a DM. Change your mind any time."
            />
            <Pillar
              eyebrow="full view"
              headline={
                <>
                  You see
                  <br />
                  every answer.
                </>
              }
              body="Watch responses land in real time. Who finished, who left, what they said. Download it whenever."
            />
          </div>
        </section>

        {/* USE CASES */}
        <section className="bg-[#0f0f0f] text-[#f2ead8] py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
              <h2
                className="text-3xl sm:text-5xl leading-tight max-w-2xl"
                style={{ fontFamily: SERIF, fontWeight: 500 }}
              >
                One form, a hundred different rooms.
              </h2>
              <p className="text-sm text-[#f2ead8]/50 max-w-xs">
                A few of the rooms people have built.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {USE_CASES.map((c) => (
                <UseCaseChip key={c.label} chip={c} />
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 py-32 sm:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-5xl sm:text-7xl leading-[1.02] tracking-tight"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              Your next form
              <br />
              could feel <em className="italic">a lot</em> better.
            </h2>
            <p className="mt-6 text-neutral-700 text-lg max-w-xl mx-auto">
              Start one in under a minute. Keep it as long as you want. Free while we&apos;re young.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/sign-up"
                className="px-7 py-3.5 bg-neutral-900 text-[#faf8f3] rounded-full font-medium hover:bg-neutral-800 transition"
              >
                Make a form
              </Link>
              <Link
                href="/templates"
                className="px-7 py-3.5 border border-neutral-900/20 rounded-full font-medium hover:bg-white transition"
              >
                Start from a template
              </Link>
            </div>
          </div>
        </section>

        <MarkFooter />
      </main>
    </>
  );
}

type UseCase = {
  label: string;
  bg: string;
  ink: string;
  pattern: "stripes-v" | "stripes-h" | "dots" | "halftone" | "grid";
};

const USE_CASES: UseCase[] = [
  { label: "Wedding RSVPs", bg: "#D85A28", ink: "#FFF4D6", pattern: "stripes-v" },
  { label: "Reading Clubs", bg: "#F2EAD8", ink: "#3D2E1A", pattern: "grid" },
  { label: "Game Polls", bg: "#1B5BA8", ink: "#D4F0FF", pattern: "dots" },
  { label: "Movie Ballots", bg: "#5DBA85", ink: "#0F3D1F", pattern: "halftone" },
  { label: "Quick Feedback", bg: "#1A1A1A", ink: "#F2EAD8", pattern: "stripes-h" },
  { label: "Auditions", bg: "#8B4513", ink: "#F2EAD8", pattern: "stripes-v" },
];

function patternForChip(c: UseCase): React.CSSProperties {
  const fg = c.ink;
  switch (c.pattern) {
    case "stripes-v":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 9px)`,
        opacity: 0.5,
      };
    case "stripes-h":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 7px)`,
        opacity: 0.4,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(${fg} 1.2px, transparent 1.8px)`,
        backgroundSize: "10px 10px",
        opacity: 0.45,
      };
    case "halftone":
      return {
        backgroundImage: `radial-gradient(${fg} 1.6px, transparent 2.4px)`,
        backgroundSize: "12px 12px",
        opacity: 0.35,
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(0deg, ${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px)`,
        backgroundSize: "14px 14px",
        opacity: 0.3,
      };
  }
}

function UseCaseChip({ chip }: { chip: UseCase }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col justify-end p-5 transition-transform hover:-translate-y-1"
      style={{
        background: chip.bg,
        color: chip.ink,
        aspectRatio: "3 / 4",
        minHeight: 180,
        boxShadow: "0 10px 24px -12px rgba(0,0,0,0.4)",
      }}
    >
      <div aria-hidden className="absolute inset-0" style={patternForChip(chip)} />
      <span
        className="relative leading-tight"
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 22,
          color: chip.ink,
        }}
      >
        {chip.label}
      </span>
    </div>
  );
}

function Pillar({
  eyebrow,
  headline,
  body,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 mb-4">{eyebrow}</p>
      <p
        className="text-4xl sm:text-5xl text-neutral-900 leading-[1.05] mb-4"
        style={{ fontFamily: SERIF, fontWeight: 500 }}
      >
        {headline}
      </p>
      <p className="text-sm text-neutral-700 leading-relaxed">{body}</p>
    </div>
  );
}
