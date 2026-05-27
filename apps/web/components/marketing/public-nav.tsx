"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { authClient } from "@repo/auth/client";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

const SERIF = "var(--font-fraunces), Georgia, serif";
const navLinkBase =
  "inline-flex min-h-11 items-center rounded-full px-4 text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3]";

export function PublicNav() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const ctaHref = session?.user ? "/dashboard" : "/sign-in";
  const ctaLabel = session?.user ? "Dashboard" : "Sign in";

  return (
    <nav className="sticky top-0 z-40 border-b border-[#1a1a1a]/10 bg-[#faf8f3]/85 text-[#17130e] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-2xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3]"
          style={{ fontFamily: SERIF, fontWeight: 500 }}
          onClick={() => setOpen(false)}
        >
          <span>sensus</span>
          <span
            aria-hidden
            className="mt-1 h-2 w-2 rounded-full bg-[#5DBA85] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-125"
          />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`${navLinkBase} ${
                  active
                    ? "bg-[#1a1a1a] text-[#f2ead8]"
                    : "text-[#17130e]/65 hover:bg-[#1a1a1a]/5 hover:text-[#17130e]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {!isPending && (
            <Link
              href={ctaHref}
              className="group ml-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#17130e] py-1.5 pl-5 pr-2 text-sm font-medium text-[#f2ead8] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3] active:scale-[0.98]"
            >
              <span>{ctaLabel}</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f2ead8]/12 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#17130e]/10 bg-white/55 text-[#17130e] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5DBA85] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3] md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-4 mb-4 rounded-[28px] border border-[#17130e]/10 bg-white/80 p-2 shadow-[0_18px_60px_rgba(23,19,14,0.10)]">
            <div className="grid gap-1">
              {LINKS.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center justify-between rounded-2xl px-4 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#17130e] text-[#f2ead8]"
                        : "text-[#17130e]/72 hover:bg-[#17130e]/5"
                    }`}
                  >
                    {l.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#5DBA85]" />}
                  </Link>
                );
              })}
              {!isPending && (
                <Link
                  href={ctaHref}
                  onClick={() => setOpen(false)}
                  className="mt-1 flex min-h-12 items-center justify-between rounded-2xl bg-[#D85A28] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c84f22]"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
