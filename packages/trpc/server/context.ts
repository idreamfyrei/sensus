import { db, DEV_USER_ID, type Database } from "@repo/database";
import { FormService } from "@repo/services";

/**
 * Per-request services container. Constructed fresh inside `createContext`
 * so each request has its own service instances (cheap — they hold no state,
 * just a db handle). React analogy: like the per-request value of a Context
 * provider, except the "render" is "one HTTP request".
 */
export type Services = {
  forms: FormService;
};

export type Context = {
  /**
   * Authenticated user id. `null` for anonymous (public) requests.
   * Phase 2: hardcoded to the seeded dev user (see below).
   * Phase 3: resolved from a Better Auth session.
   */
  userId: string | null;
  db: Database;
  services: Services;
};

/**
 * Build the per-request context. Currently doesn't need the Express
 * `req`/`res` since auth is hardcoded to `DEV_USER_ID` (seeded by
 * `pnpm db:seed-dev`). Phase 3 will read the session cookie from
 * `req.headers` and look up the real userId.
 */
export async function createContext(): Promise<Context> {
  return {
    userId: DEV_USER_ID,
    db,
    services: {
      forms: new FormService(db),
    },
  };
}
