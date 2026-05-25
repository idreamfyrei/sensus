/**
 * Shared between the Phase 2 dev seed script and the tRPC context.
 *
 * Phase 2 has no real auth — every request is treated as coming from this
 * one user. The seed inserts the row; the context hardcodes the id. Both
 * read from this file so they can't drift.
 *
 * In Phase 3 (Better Auth wiring), `createContext` will resolve the user
 * from the session cookie and this constant will be deleted.
 */
export const DEV_USER_ID = "user_dev_phase2";

export const DEV_USER = {
  id: DEV_USER_ID,
  name: "Dev User",
  email: "dev@sensus.local",
  emailVerified: true,
} as const;

/** Theme.key for the always-present default theme. Phase 4 will seed all 10. */
export const DEFAULT_THEME_KEY = "default" as const;
