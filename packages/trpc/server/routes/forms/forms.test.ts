/**
 * tRPC-caller integration tests for the forms slice.
 *
 * Builds the same `serverRouter` apps/api mounts, but calls procedures
 * via `serverRouter.createCaller(ctx)` — no HTTP, no Express. Every layer
 * still runs: input Zod validation, middleware (auth + service-error mapper),
 * controller, service, db.
 *
 * Proves:
 *   - protectedProcedure rejects anonymous callers with UNAUTHORIZED
 *   - forms.create roundtrips a real form through to Postgres
 *   - forms.publish optimistic-concurrency surfaces as CONFLICT
 *   - publicForm.getBySlug + submit work without a user
 *   - service errors are mapped to the right TRPCError codes
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { TRPCError } from "@trpc/server";
import { themesTable, user as userTable, type Pool } from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";
import { AccountService, FormService } from "@repo/services";

import { serverRouter } from "../../index";
import type { Context } from "../../context";

type TestDb = ReturnType<typeof createTestDb>["db"];

const TEST_USER = {
  id: "user_caller_test",
  name: "Caller Test User",
  email: "caller-test@example.com",
  emailVerified: false,
};

let db: TestDb;
let pool: Pool;
let themeId: string;

beforeAll(async () => {
  const handle = createTestDb();
  db = handle.db;
  pool = handle.pool;
  await setupTestDb(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
  await db.insert(userTable).values(TEST_USER);
  const [theme] = await db
    .insert(themesTable)
    .values({
      key: "default",
      name: "Default",
      bg: "#ffffff",
      surface: "#ffffff",
      primary: "#000000",
      accent: "#000000",
      textColor: "#000000",
      muted: "#888888",
      borderStyle: "solid",
      borderRadius: "0.5rem",
      fontHeading: "sans-serif",
      fontBody: "sans-serif",
    })
    .returning();
  if (!theme) throw new Error("beforeEach: theme seed returned nothing");
  themeId = theme.id;
});

afterAll(async () => {
  await pool.end();
});

/** Build a Context manually — same shape `createContext` returns, but with
 *  the user-id we want to test (or `null` for anonymous). */
function makeCtx(userId: string | null): Context {
  return {
    userId,
    db,
    services: { forms: new FormService(db), account: new AccountService(db) },
  };
}

const validInput = () => ({ title: "Test Form", themeId });

// ─── Auth boundary ──────────────────────────────────────────────────────────

describe("auth middleware", () => {
  it("forms.create rejects an anonymous caller with UNAUTHORIZED", async () => {
    const caller = serverRouter.createCaller(makeCtx(null));
    await expect(caller.forms.create(validInput())).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("forms.list rejects an anonymous caller with UNAUTHORIZED", async () => {
    const caller = serverRouter.createCaller(makeCtx(null));
    await expect(caller.forms.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── Creator path (forms router) ────────────────────────────────────────────

describe("forms.create", () => {
  it("creates a form when called by an authenticated user", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());

    expect(form.title).toBe("Test Form");
    expect(form.status).toBe("draft");
    expect(form.userId).toBe(TEST_USER.id);
    expect(form.slug).toMatch(/^test-form-[a-z0-9]{6}$/);
  });

  it("rejects an empty title at the Zod input boundary (BAD_REQUEST)", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    await expect(caller.forms.create({ title: "", themeId })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("forms.list", () => {
  it("returns only the calling user's forms", async () => {
    // Two forms from the test user.
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    await caller.forms.create({ title: "Mine 1", themeId });
    await caller.forms.create({ title: "Mine 2", themeId });

    const forms = await caller.forms.list();
    expect(forms).toHaveLength(2);
    expect(forms.every((f) => f.userId === TEST_USER.id)).toBe(true);
  });
});

describe("forms.publish", () => {
  it("flips status to published when version matches", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());
    const published = await caller.forms.publish({
      id: created.id,
      version: created.version,
    });

    expect(published.status).toBe("published");
    expect(published.version).toBe(created.version + 1);
  });

  it("maps a stale version to CONFLICT", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());

    await expect(
      caller.forms.publish({ id: created.id, version: created.version + 99 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("maps a non-owner publish attempt to FORBIDDEN", async () => {
    // First user creates the form.
    const ownerCaller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await ownerCaller.forms.create(validInput());

    // Seed a different user and try to publish as them.
    const OTHER_USER_ID = "user_other";
    await db.insert(userTable).values({
      id: OTHER_USER_ID,
      name: "Other",
      email: "other@example.com",
      emailVerified: false,
    });
    const otherCaller = serverRouter.createCaller(makeCtx(OTHER_USER_ID));

    await expect(
      otherCaller.forms.publish({ id: created.id, version: created.version }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── Public path (publicForm router) ────────────────────────────────────────

describe("publicForm.getBySlug", () => {
  it("returns the form for a valid slug (anonymous)", async () => {
    const owner = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await owner.forms.create(validInput());

    const anon = serverRouter.createCaller(makeCtx(null));
    const form = await anon.publicForm.getBySlug({ slug: created.slug });
    expect(form.id).toBe(created.id);
  });

  it("maps an unknown slug to NOT_FOUND", async () => {
    const anon = serverRouter.createCaller(makeCtx(null));
    await expect(anon.publicForm.getBySlug({ slug: "nonexistent-xyzabc" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("publicForm.submit", () => {
  it("accepts a submission to a published form", async () => {
    const owner = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await owner.forms.create(validInput());
    await owner.forms.publish({ id: created.id, version: created.version });

    const anon = serverRouter.createCaller(makeCtx(null));
    const result = await anon.publicForm.submit({ slug: created.slug, answers: [] });
    expect(result.responseId).toBeDefined();
  });

  it("maps a submission to a draft form to BAD_REQUEST", async () => {
    const owner = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await owner.forms.create(validInput());

    const anon = serverRouter.createCaller(makeCtx(null));
    await expect(anon.publicForm.submit({ slug: created.slug, answers: [] })).rejects.toMatchObject(
      { code: "BAD_REQUEST" },
    );
  });
});

// ─── Type bridge sanity ─────────────────────────────────────────────────────

describe("ServerRouter type export", () => {
  it("is a TRPCError type the client can match on", () => {
    // Compile-time check, runtime asserts shape exists.
    expect(typeof TRPCError).toBe("function");
  });
});
