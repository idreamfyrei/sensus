"use client";

import Link from "next/link";
import type { RouterOutputs } from "@repo/trpc/client";

type PublicForm = RouterOutputs["forms"]["listPublic"][number];

export function FormCard({
  form,
  href,
  cta,
  footer,
}: {
  form: PublicForm;
  href: string;
  cta: string;
  footer?: React.ReactNode;
}) {
  const t = form.theme;
  return (
    <article
      className="rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition flex flex-col"
      style={{ background: t.surface, color: t.textColor }}
    >
      <div className="px-5 py-6 space-y-3" style={{ background: t.bg, fontFamily: t.fontBody }}>
        <div className="flex gap-1">
          {[t.surface, t.primary, t.accent, t.muted].map((c, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full border border-black/10"
              style={{ background: c }}
              aria-hidden
            />
          ))}
        </div>
        <h3
          className="text-xl leading-tight"
          style={{ fontFamily: t.fontHeading, color: t.primary }}
        >
          {form.title}
        </h3>
        {form.description && <p className="text-sm opacity-80 line-clamp-3">{form.description}</p>}
        <p className="text-xs opacity-60 capitalize">Theme · {t.name}</p>
      </div>
      <div className="bg-white border-t border-neutral-200 px-5 py-3 flex items-center justify-between gap-2">
        <Link href={href} className="text-sm font-medium text-neutral-900 hover:underline">
          {cta} →
        </Link>
        {footer}
      </div>
    </article>
  );
}
