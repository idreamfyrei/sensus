import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

/**
 * Server-component shell that wraps the client form in <Suspense>.
 * Next.js 16 requires this when any descendant uses `useSearchParams()`
 * (we read `?next=` to know where to redirect after login).
 */
export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-8">
      <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
