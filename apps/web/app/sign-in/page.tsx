import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

// Server shell — Suspense is required by Next 16 for useSearchParams.
export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
