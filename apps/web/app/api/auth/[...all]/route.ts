/**
 * Better Auth HTTP entry point.
 *
 * Every auth-related URL the client hits — sign-in/email, sign-up/email,
 * sign-in/social (Google), callback/google, get-session, sign-out — lands
 * here. `toNextJsHandler` adapts Better Auth's universal `auth.handler`
 * (a `(Request) => Promise<Response>`) into the GET/POST exports Next.js
 * App Router expects.
 *
 * This is the ONLY runtime that serves these endpoints. The Express api
 * never receives auth HTTP traffic — it just reads the session cookie via
 * `auth.api.getSession()` (a library call, no roundtrip) to identify users.
 */
import { auth } from "@repo/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
