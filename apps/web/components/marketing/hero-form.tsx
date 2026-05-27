import Link from "next/link";

const SERIF = "var(--font-fraunces), Georgia, serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/**
 * The hero is the product. A life-size ballot is handed to the visitor.
 * The three CTAs are the ballot's three answer options. Voting begins
 * the user's path into Sensus.
 */
export function HeroForm() {
  return (
    <section className="relative px-4 sm:px-6 pt-14 pb-24 sm:pt-20 sm:pb-32 overflow-hidden">
      {/* paper grain over warm cream */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(rgba(60, 40, 20, 0.08) 1px, transparent 1.2px)",
          backgroundSize: "4px 4px",
        }}
      />
      {/* soft warm wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 18% 10%, rgba(216, 90, 40, 0.10), transparent 60%), radial-gradient(60% 50% at 92% 8%, rgba(27, 91, 168, 0.07), transparent 60%)",
        }}
      />

      {/* tape strips above the ballot, suggesting it's been stuck up on a wall */}
      <TapeStrips />

      <div className="relative max-w-5xl mx-auto">
        <Ballot />
      </div>

      {/* below-ballot legend */}
      <div className="relative max-w-5xl mx-auto mt-12 sm:mt-16 grid sm:grid-cols-12 gap-6 sm:gap-10 items-start">
        <p
          className="sm:col-span-7 text-base sm:text-lg text-neutral-700 leading-relaxed"
          style={{ fontFamily: SERIF }}
        >
          <span className="text-2xl sm:text-3xl text-neutral-900" style={{ fontWeight: 500 }}>
            Sensus
          </span>{" "}
          is a form builder for the people who answer, not just the people who ask. Pick a feeling,
          write the questions, send the link.
        </p>
        <div className="sm:col-span-5 flex sm:justify-end">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/70 ring-1 ring-black/[0.06] px-4 py-2 text-[10px] tracking-[0.25em] uppercase text-neutral-600">
            <BallotArrow />
            <span>cast your vote above</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Ballot ----------------------------- */

function Ballot() {
  return (
    <div className="relative" style={{ transform: "rotate(-0.8deg)" }}>
      {/* shadow plate underneath, slightly offset for paper depth */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[28px] bg-[#e9dfc6] translate-x-1.5 translate-y-2 -z-10"
      />

      {/* outer paper */}
      <div className="relative bg-[#fdfaf0] rounded-[28px] ring-1 ring-black/[0.07] shadow-[0_40px_80px_-30px_rgba(60,40,20,0.28)] overflow-hidden">
        {/* top meta strip */}
        <div
          className="px-6 sm:px-12 pt-6 pb-4 flex items-center justify-between gap-4 text-[10px] tracking-[0.28em] uppercase text-neutral-500 border-b border-dashed border-neutral-300/70"
          style={{ fontFamily: MONO }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D85A28]" />
            sensus · ballot no. 001
          </span>
          <span className="hidden sm:inline">issue mmxxvi</span>
          <span>№ 14,237</span>
        </div>

        {/* body */}
        <div className="relative px-6 sm:px-12 md:px-16 py-10 sm:py-14">
          {/* vertical guide rail (decorative left margin like ruled paper) */}
          <span
            aria-hidden
            className="absolute left-4 sm:left-6 top-10 bottom-10 w-px bg-neutral-300/60 hidden sm:block"
          />

          <div className="flex items-center gap-3">
            <Eyebrow>please answer truthfully</Eyebrow>
            <span
              className="text-[10px] tracking-[0.28em] uppercase text-neutral-400"
              style={{ fontFamily: MONO }}
            >
              {"// q. 1 / 1"}
            </span>
          </div>

          <h1
            className="mt-7 text-[clamp(2.5rem,7.5vw,5.75rem)] leading-[0.95] tracking-tight text-neutral-900"
            style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.025em" }}
          >
            What kind of form
            <br />
            would you <em className="italic">actually</em>
            <br />
            finish?
          </h1>

          <p
            className="mt-7 text-lg sm:text-2xl text-neutral-600 max-w-xl leading-snug"
            style={{ fontFamily: SERIF }}
          >
            Mark one. Or all three. <em className="italic">We won&apos;t tell.</em>
          </p>

          {/* options */}
          <div className="mt-10 sm:mt-12 space-y-2 sm:space-y-3">
            <BallotOption letter="A" href="/sign-up" accent="#D85A28">
              The kind I&apos;d build <em className="italic">myself</em>.
            </BallotOption>
            <BallotOption letter="B" href="/explore" accent="#1B5BA8">
              Show me ones people already made.
            </BallotOption>
            <BallotOption letter="C" href="/templates" accent="#5DBA85">
              Something pre-made and quiet.
            </BallotOption>
          </div>
        </div>

        {/* signing row */}
        <div
          className="px-6 sm:px-12 md:px-16 py-5 sm:py-6 border-t border-dashed border-neutral-300/70 grid grid-cols-3 gap-3 sm:gap-6 text-[10px] tracking-[0.22em] uppercase text-neutral-500"
          style={{ fontFamily: MONO }}
        >
          <SignField label="signed" value="anonymous" italic />
          <SignField label="dated" value="now" />
          <SignField label="room" value="sensus.so" />
        </div>
      </div>

      {/* APPROVED stamp */}
      <ApprovedStamp />
      {/* free / no card sticker */}
      <FreeChip />
      {/* page corner fold */}
      <CornerFold />
    </div>
  );
}

/* ----------------------------- bits ----------------------------- */

function BallotOption({
  letter,
  href,
  children,
  accent,
}: {
  letter: string;
  href: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 sm:gap-6 py-3 sm:py-4 px-3 -mx-3 rounded-2xl hover:bg-neutral-900/[0.025] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {/* checkbox */}
      <span className="relative inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md ring-[2px] ring-neutral-900 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-neutral-900">
        <CheckIcon className="h-4 w-4 text-[#fdfaf0] opacity-0 -rotate-12 scale-75 group-hover:opacity-100 group-hover:rotate-0 group-hover:scale-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
      </span>

      {/* letter */}
      <span
        className="text-xs tracking-[0.3em] uppercase text-neutral-400 w-5 sm:w-6"
        style={{ fontFamily: MONO }}
      >
        {letter}
      </span>

      {/* option text */}
      <span
        className="flex-1 text-xl sm:text-3xl leading-snug text-neutral-900"
        style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        {children}
      </span>

      {/* arrow */}
      <span className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-neutral-300 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:ring-transparent overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: accent }}
        />
        <ArrowIcon className="relative h-3.5 w-3.5 text-neutral-500 group-hover:text-[#fdfaf0] transition-colors duration-500" />
      </span>
    </Link>
  );
}

function SignField({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span>{label}</span>
      <span
        className={`text-sm sm:text-base text-neutral-800 normal-case tracking-normal ${italic ? "italic" : ""}`}
        style={{ fontFamily: SERIF, fontWeight: 500 }}
      >
        {value}
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium ring-1 bg-black/[0.04] text-neutral-600 ring-black/[0.06]">
      {children}
    </span>
  );
}

/* ----------------------------- decorations ----------------------------- */

function ApprovedStamp() {
  return (
    <div
      aria-hidden
      className="absolute -top-5 sm:top-6 right-2 sm:-right-6 pointer-events-none select-none"
      style={{ transform: "rotate(13deg)" }}
    >
      <div
        className="rounded-full border-[3px] border-[#D85A28] text-[#D85A28] px-4 sm:px-5 py-3 sm:py-4 flex flex-col items-center justify-center text-center bg-[#fdfaf0]/30"
        style={{ fontFamily: MONO }}
      >
        <span className="text-[11px] sm:text-xs tracking-[0.32em] uppercase font-bold">
          answered
        </span>
        <span className="h-px w-10 my-1.5" style={{ background: "#D85A28" }} />
        <span className="text-[9px] tracking-[0.22em] uppercase">47 today</span>
      </div>
    </div>
  );
}

function FreeChip() {
  return (
    <div
      aria-hidden
      className="absolute -bottom-3 left-6 sm:-bottom-4 sm:left-16 pointer-events-none"
      style={{ transform: "rotate(-3deg)" }}
    >
      <div className="bg-[#0e0e0e] text-[#f2ead8] rounded-full px-4 py-2 text-[10px] tracking-[0.25em] uppercase shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] inline-flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5DBA85] animate-pulse" />
        free ballot · no card
      </div>
    </div>
  );
}

function CornerFold() {
  // page-corner peel in top-left
  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 pointer-events-none"
      style={{ borderTopLeftRadius: 28 }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" className="block">
        <defs>
          <linearGradient id="fold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3ead0" />
            <stop offset="1" stopColor="#e1d4b3" />
          </linearGradient>
        </defs>
        <path
          d="M0 0 H 36 L 0 36 Z"
          fill="url(#fold)"
          stroke="rgba(60,40,20,0.12)"
          strokeWidth="0.5"
        />
        <path d="M0 36 L 36 0" stroke="rgba(60,40,20,0.18)" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

function TapeStrips() {
  // two strips of "tape" at the top edges of the ballot, like the page was stuck up on a wall
  return (
    <div aria-hidden className="relative max-w-5xl mx-auto h-0">
      <span
        className="absolute -top-2 left-12 sm:left-24 w-24 h-7 rounded-[2px] opacity-80 shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
        style={{
          transform: "rotate(-6deg)",
          background:
            "linear-gradient(180deg, rgba(255, 232, 165, 0.55), rgba(245, 215, 130, 0.45))",
        }}
      />
      <span
        className="absolute -top-3 right-10 sm:right-32 w-28 h-7 rounded-[2px] opacity-80 shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
        style={{
          transform: "rotate(8deg)",
          background:
            "linear-gradient(180deg, rgba(255, 232, 165, 0.55), rgba(245, 215, 130, 0.45))",
        }}
      />
    </div>
  );
}

/* ----------------------------- icons ----------------------------- */

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`relative ${className}`} aria-hidden>
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

function BallotArrow() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M8 13V3M4 7l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M3 8.5l3.2 3.2L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
