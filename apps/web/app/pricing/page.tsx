import Link from "next/link";
import { Check } from "lucide-react";
import { PublicNav } from "~/components/marketing/public-nav";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Everything you need to ship your first form.",
    features: [
      "Unlimited draft forms",
      "Up to 100 responses / form",
      "10 themes",
      "Conditional logic",
      "Public + unlisted visibility",
      "Email notifications",
    ],
    cta: { label: "Get started", href: "/sign-up" },
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per creator / month",
    blurb: "For creators who run several forms in parallel.",
    features: [
      "Unlimited responses",
      "Custom domain for /f/[slug]",
      "Remove Sensus branding",
      "CSV export + raw response API",
      "Priority email support",
      "Cloudinary asset upload",
    ],
    cta: { label: "Start free trial", href: "/sign-up" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    blurb: "For teams who need SSO and compliance.",
    features: [
      "SAML SSO",
      "Audit logs",
      "Custom data retention",
      "SOC 2 documentation",
      "Dedicated infrastructure",
      "Signed BAA",
    ],
    cta: { label: "Talk to us", href: "mailto:hello@sensus.app" },
  },
];

export default function PricingPage() {
  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-neutral-50">
        <header className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
          <p className="text-neutral-600">
            Sensus is free while we&apos;re in public beta. The tiers below are what we&apos;ll roll
            out at GA.
          </p>
        </header>

        <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`p-6 rounded-xl flex flex-col gap-5 ${
                t.highlighted
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white border border-neutral-200"
              }`}
            >
              <div className="space-y-1">
                <p
                  className={`text-sm font-medium ${t.highlighted ? "text-neutral-300" : "text-neutral-500"}`}
                >
                  {t.name}
                </p>
                <p className="text-3xl font-semibold tracking-tight">{t.price}</p>
                <p className={`text-xs ${t.highlighted ? "text-neutral-400" : "text-neutral-500"}`}>
                  {t.cadence}
                </p>
              </div>
              <p className={`text-sm ${t.highlighted ? "text-neutral-200" : "text-neutral-700"}`}>
                {t.blurb}
              </p>
              <ul className="space-y-2 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${t.highlighted ? "text-neutral-200" : "text-neutral-700"}`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.cta.href}
                className={`text-center px-4 py-3 rounded-lg font-medium transition ${
                  t.highlighted
                    ? "bg-white text-neutral-900 hover:bg-neutral-100"
                    : "border border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                {t.cta.label} →
              </Link>
            </div>
          ))}
        </div>

        <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500">
          All tiers are cosmetic during beta — no quota enforcement is wired in code yet. See the
          README for what&apos;s actually metered.
        </footer>
      </main>
    </>
  );
}
