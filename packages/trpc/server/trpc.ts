import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import type { Context } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<Context>().create({});

export const router = tRPCContext.router;

// Match on `code` string field (not `instanceof`) — workspace module
// resolution can give different class identities to the same export.
const SERVICE_ERROR_CODE_TO_TRPC = {
  FORM_NOT_FOUND: "NOT_FOUND",
  FORM_FORBIDDEN: "FORBIDDEN",
  FORM_VERSION_MISMATCH: "CONFLICT",
  FORM_NOT_PUBLISHED: "BAD_REQUEST",
  FORM_SCHEMA_LOCKED: "CONFLICT",
  FIELD_NOT_FOUND: "NOT_FOUND",
  FIELD_OPTIONS_REQUIRED: "BAD_REQUEST",
  ACCOUNT_NOT_FOUND: "NOT_FOUND",
  INVALID_ANSWER: "BAD_REQUEST",
  THEME_NOT_FOUND: "NOT_FOUND",
  SECTION_NOT_FOUND: "NOT_FOUND",
  SECTION_HAS_FIELDS: "CONFLICT",
  LAST_SECTION: "CONFLICT",
  CONDITION_NOT_FOUND: "NOT_FOUND",
  CONDITION_INVALID_TARGET: "BAD_REQUEST",
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

const authMiddleware = tRPCContext.middleware(({ ctx, next }) => {
  if (ctx.userId === null) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const publicProcedure = tRPCContext.procedure.use(serviceErrorMapper);

export const protectedProcedure = tRPCContext.procedure.use(serviceErrorMapper).use(authMiddleware);
