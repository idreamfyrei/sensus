"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@repo/auth/client";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicNav() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Sensus
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-1 text-sm rounded transition ${
                  active
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {isPending ? null : session?.user ? (
            <Link
              href="/dashboard"
              className="ml-2 px-3 py-1.5 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800 transition"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="ml-2 px-3 py-1.5 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800 transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
