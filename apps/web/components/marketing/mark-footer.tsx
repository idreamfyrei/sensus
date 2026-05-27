"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

const SERIF = "var(--font-fraunces), Georgia, serif";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Footer that opens with a tiny form. Two blanks resolve into a thank-you.
 * Below: real link columns, a quiet status line, and the wordmark used as
 * background texture rather than as a centerpiece.
 */
export function MarkFooter() {
  const [topic, setTopic] = useState("");
  const [feel, setFeel] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !feel.trim()) return;
    setSubmitted(true);
  };

  const inputClass =
    "inline-block bg-transparent border-0 border-b border-current/40 focus:border-current focus:outline-none px-1 text-current placeholder:text-current/40 transition-colors";

  return (
    <footer className="relative bg-[#0e0e0e] text-[#f2ead8] pt-28 pb-10 overflow-hidden">
      {/* dotted texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(rgba(242, 234, 216, 0.9) 1px, transparent 1.4px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* huge background wordmark */}
      <div
        aria-hidden
        className="absolute -bottom-14 left-1/2 -translate-x-1/2 select-none pointer-events-none"
        style={{
          fontFamily: SERIF,
          fontSize: "min(34vw, 540px)",
          lineHeight: 0.85,
          letterSpacing: "-0.04em",
          color: "rgba(242, 234, 216, 0.04)",
          whiteSpace: "nowrap",
        }}
      >
        sensus
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* row 1: the tiny form */}
        <div className="max-w-4xl">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium ring-1 bg-[#f2ead8]/10 text-[#f2ead8]/70 ring-[#f2ead8]/15">
            before you go
          </span>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="open"
                  initial={false}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onSubmit={handleSubmit}
                  className="text-3xl sm:text-5xl leading-[1.2] tracking-tight"
                  style={{ fontFamily: SERIF, fontWeight: 500 }}
                >
                  <span>I&apos;d love a form for </span>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="book club"
                    aria-label="What kind of form would you love?"
                    className={inputClass}
                    style={{ width: "min(280px, 60vw)", fontFamily: "inherit" }}
                  />
                  <span> that feels </span>
                  <input
                    type="text"
                    value={feel}
                    onChange={(e) => setFeel(e.target.value)}
                    placeholder="like home"
                    aria-label="What should it feel like?"
                    className={inputClass}
                    style={{ width: "min(240px, 50vw)", fontFamily: "inherit" }}
                  />
                  <span>.</span>
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={!topic.trim() || !feel.trim()}
                      className="group inline-flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-sm font-medium bg-[#f2ead8] text-[#0e0e0e] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
                    >
                      <span>send this thought</span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0e0e0e]/10 text-[#0e0e0e] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                        <ArrowIcon className="h-3 w-3" />
                      </span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="text-3xl sm:text-5xl leading-[1.2] tracking-tight"
                  style={{ fontFamily: SERIF, fontWeight: 500 }}
                >
                  <p>
                    Noted. A form for{" "}
                    <span className="italic underline decoration-2 underline-offset-4">
                      {topic}
                    </span>{" "}
                    that feels{" "}
                    <span className="italic underline decoration-2 underline-offset-4">{feel}</span>
                    .
                  </p>
                  <p className="mt-5 text-base text-[#f2ead8]/60 font-sans">
                    Thanks for stopping by.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* divider */}
        <hr className="my-16 border-[#f2ead8]/10" />

        {/* row 2: brand + link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-10 sm:gap-8">
          {/* brand block */}
          <div className="col-span-2 sm:col-span-5 space-y-5">
            <Link
              href="/"
              className="group inline-flex items-baseline gap-2 text-4xl tracking-tight"
              style={{ fontFamily: SERIF, fontWeight: 500 }}
            >
              <span>sensus</span>
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full bg-[#5DBA85] translate-y-[-4px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125"
              />
            </Link>
            <p className="text-sm text-[#f2ead8]/55 max-w-xs leading-relaxed">
              A form builder for the people who answer, not just the people who ask.
            </p>
            <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-[#f2ead8]/45">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5DBA85] animate-pulse" />
              free while we&apos;re young
            </div>
          </div>

          {/* link columns */}
          <FooterCol
            className="col-span-1 sm:col-span-2"
            title="product"
            links={[
              { href: "/explore", label: "Explore" },
              { href: "/templates", label: "Templates" },
              { href: "/pricing", label: "Pricing" },
              { href: "/sign-up", label: "Make one" },
            ]}
          />
          <FooterCol
            className="col-span-1 sm:col-span-2"
            title="learn"
            links={[
              { href: "/explore", label: "Examples" },
              { href: "/templates", label: "Use cases" },
              { href: "/pricing", label: "FAQ" },
            ]}
          />
          <FooterCol
            className="col-span-2 sm:col-span-3"
            title="say hi"
            links={[
              { href: "mailto:hello@sensus.so", label: "hello@sensus.so" },
              { href: "https://twitter.com", label: "Twitter / X" },
              { href: "https://instagram.com", label: "Instagram" },
            ]}
          />
        </div>

        {/* base line */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 text-[10px] tracking-[0.22em] uppercase text-[#f2ead8]/35">
          <span>made for the people who answer, not just the people who ask</span>
          <span className="inline-flex items-center gap-4">
            <span>© sensus, {new Date().getFullYear()}</span>
            <Link href="/" className="hover:text-[#f2ead8]/70 transition-colors">
              terms
            </Link>
            <Link href="/" className="hover:text-[#f2ead8]/70 transition-colors">
              privacy
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  className = "",
  title,
  links,
}: {
  className?: string;
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-[10px] tracking-[0.22em] uppercase text-[#f2ead8]/45">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="group inline-flex items-baseline gap-2 text-[15px] text-[#f2ead8]/85 hover:text-[#f2ead8] transition-colors"
              style={{ fontFamily: SERIF }}
            >
              <span>{l.label}</span>
              <span
                aria-hidden
                className="inline-block h-px w-3 bg-[#f2ead8]/30 translate-y-[-4px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
