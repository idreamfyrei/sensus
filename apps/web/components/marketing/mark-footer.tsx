"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

/**
 * A footer that itself is a tiny form. Visitors fill in two blanks; on
 * submit, the line resolves to a thank-you and a small star marks the
 * gesture. State is local, never sent anywhere. The point is the
 * moment, not the payload.
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
    <footer className="bg-[#0e0e0e] text-[#f2ead8] pt-24 pb-12 relative overflow-hidden">
      {/* huge wordmark in the background */}
      <div
        aria-hidden
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 select-none pointer-events-none"
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: "min(34vw, 540px)",
          lineHeight: 0.85,
          letterSpacing: "-0.04em",
          color: "rgba(242, 234, 216, 0.04)",
          whiteSpace: "nowrap",
        }}
      >
        sensus
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <p className="text-xs tracking-[0.25em] uppercase text-[#f2ead8]/50 mb-8">before you go</p>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="open"
              initial={false}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="font-serif text-3xl sm:text-5xl leading-[1.2] tracking-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
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
                  className="text-sm tracking-wide px-5 py-2.5 bg-[#f2ead8] text-[#0e0e0e] rounded-full font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  send this thought
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-3xl sm:text-5xl leading-[1.2] tracking-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              <p>
                Noted. A form for{" "}
                <span className="italic underline decoration-2 underline-offset-4">{topic}</span>{" "}
                that feels{" "}
                <span className="italic underline decoration-2 underline-offset-4">{feel}</span>.
              </p>
              <p className="mt-5 text-base text-[#f2ead8]/60 font-sans">Thanks for stopping by.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <hr className="my-16 border-[#f2ead8]/10" />

        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="space-y-2">
            <Link
              href="/"
              className="block text-3xl font-serif tracking-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              sensus
            </Link>
            <p className="text-xs text-[#f2ead8]/40 max-w-xs">
              A form builder for people who care how it feels.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#f2ead8]/70">
            <Link href="/explore" className="hover:text-[#f2ead8] transition">
              Explore
            </Link>
            <Link href="/templates" className="hover:text-[#f2ead8] transition">
              Templates
            </Link>
            <Link href="/pricing" className="hover:text-[#f2ead8] transition">
              Pricing
            </Link>
            <Link href="/sign-up" className="hover:text-[#f2ead8] transition">
              Make one
            </Link>
          </nav>
        </div>

        <p className="mt-12 text-[10px] tracking-[0.25em] uppercase text-[#f2ead8]/30">
          made for the people who answer, not just the people who ask
        </p>
      </div>
    </footer>
  );
}
