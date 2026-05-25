import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import type { Context } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<Context>().create({});

export const router = tRPCContext.router;

/**
 * Maps known service error codes → TRPCError codes. We match on the
 * service error's `code` string field (not `instanceof`) because pnpm
 * workspace module resolution can give different class identities to the
 * same export depending on the import path — string equality is robust
 * across that boundary. Every service error class declares a `readonly
 * code = "..."` literal field we can read here.
 *
 * Add a case for each new typed service error as it lands.
 */
const SERVICE_ERROR_CODE_TO_TRPC = {
  FORM_NOT_FOUND: "NOT_FOUND",
  FORM_FORBIDDEN: "FORBIDDEN",
  FORM_VERSION_MISMATCH: "CONFLICT",
  FORM_NOT_PUBLISHED: "BAD_REQUEST",
} as const satisfies Record<string, TRPCError["code"]>;

type ErrorWithCode = { code: string; message?: string };

function hasServiceCode(err: unknown): err is ErrorWithCode {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

const serviceErrorMapper = tRPCContext.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok) {
    // tRPC v11: middleware sees errors via `result.ok === false`, not throws.
    const cause = result.error.cause;
    if (hasServiceCode(cause)) {
      const mapped =
        SERVICE_ERROR_CODE_TO_TRPC[cause.code as keyof typeof SERVICE_ERROR_CODE_TO_TRPC];
      if (mapped !== undefined) {
        throw new TRPCError({ code: mapped, message: cause.message ?? cause.code });
      }
    }
  }
  return result;
});

/**
 * Auth middleware. Asserts `ctx.userId` is non-null, then narrows the type
 * so downstream handlers see `ctx.userId: string` (no null check needed).
 * React analogy: like a route guard that pulls `useSession()` and redirects
 * if missing — same idea, server-side.
 */
const authMiddleware = tRPCContext.middleware(({ ctx, next }) => {
  if (ctx.userId === null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

/** Public procedure: anonymous OK, but service errors still get mapped. */
export const publicProcedure = tRPCContext.procedure.use(serviceErrorMapper);

/** Protected procedure: requires `ctx.userId`, plus the same error mapping. */
export const protectedProcedure = tRPCContext.procedure.use(serviceErrorMapper).use(authMiddleware);
