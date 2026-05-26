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
import { eq, themesTable, user as userTable, type Pool } from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";
import {
  AccountService,
  ConditionService,
  FieldService,
  FormService,
  SectionService,
  ThemeService,
} from "@repo/services";
import { seedThemes } from "@repo/database/seed-themes";

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
    services: {
      forms: new FormService(db),
      fields: new FieldService(db),
      account: new AccountService(db),
      themes: new ThemeService(db),
      sections: new SectionService(db),
      conditions: new ConditionService(db),
    },
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

describe("forms.setTheme", () => {
  it("updates themeId on a draft form and bumps version", async () => {
    await seedThemes(db);
    const [altRow] = await db.select().from(themesTable).where(eq(themesTable.key, "pixel"));
    if (!altRow) throw new Error("pixel preset missing");

    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());

    const updated = await caller.forms.setTheme({
      id: created.id,
      themeId: altRow.id,
      version: created.version,
    });

    expect(updated.themeId).toBe(altRow.id);
    expect(updated.version).toBe(created.version + 1);
  });

  it("maps an unknown themeId to NOT_FOUND", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());

    await expect(
      caller.forms.setTheme({
        id: created.id,
        themeId: "11111111-1111-4111-8111-111111111111",
        version: created.version,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("maps a setTheme call on a published form to CONFLICT (schema lock)", async () => {
    await seedThemes(db);
    const [altRow] = await db.select().from(themesTable).where(eq(themesTable.key, "pixel"));
    if (!altRow) throw new Error("pixel preset missing");

    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());
    const published = await caller.forms.publish({
      id: created.id,
      version: created.version,
    });

    await expect(
      caller.forms.setTheme({
        id: created.id,
        themeId: altRow.id,
        version: published.version,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("themes.list", () => {
  it("returns the 10 plan presets to anonymous callers", async () => {
    await seedThemes(db);
    const anon = serverRouter.createCaller(makeCtx(null));
    const themes = await anon.themes.list();
    expect(themes).toHaveLength(10);
    expect(themes.map((t) => t.key)).toContain("pixel");
    expect(themes.map((t) => t.key)).toContain("anime");
    expect(themes.map((t) => t.key)).not.toContain("default");
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

describe("forms.setLayout", () => {
  it("updates layout on a draft form and bumps version", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());

    const updated = await caller.forms.setLayout({
      id: created.id,
      layout: "single_page",
      version: created.version,
    });
    expect(updated.layout).toBe("single_page");
    expect(updated.version).toBe(created.version + 1);
  });

  it("maps setLayout on a published form to CONFLICT", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const created = await caller.forms.create(validInput());
    const published = await caller.forms.publish({
      id: created.id,
      version: created.version,
    });
    await expect(
      caller.forms.setLayout({
        id: created.id,
        layout: "single_page",
        version: published.version,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("sections router", () => {
  it("add → update → reorder → delete happy path", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const full = await caller.forms.get({ id: form.id });
    const firstSectionId = full.sections[0]?.id;
    if (!firstSectionId) throw new Error("default section missing");

    const second = await caller.sections.add({ formId: form.id });
    const third = await caller.sections.add({ formId: form.id });

    await caller.sections.update({
      sectionId: second.id,
      patch: { title: "Page 2", pageBreakBefore: true },
    });

    await caller.sections.reorder({
      formId: form.id,
      orderedIds: [third.id, firstSectionId, second.id],
    });

    const after = await caller.forms.get({ id: form.id });
    expect(after.sections.map((s) => s.id)).toEqual([third.id, firstSectionId, second.id]);

    await caller.sections.delete({ sectionId: third.id });
    const final = await caller.forms.get({ id: form.id });
    expect(final.sections).toHaveLength(2);
  });

  it("delete maps a section-with-fields to CONFLICT", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const second = await caller.sections.add({ formId: form.id });
    await caller.fields.add({
      formId: form.id,
      sectionId: second.id,
      type: "short_text",
      label: "Q",
    });
    await expect(caller.sections.delete({ sectionId: second.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("delete the last section maps to CONFLICT", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const full = await caller.forms.get({ id: form.id });
    const only = full.sections[0]?.id;
    if (!only) throw new Error("seed");
    await expect(caller.sections.delete({ sectionId: only })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("fields.reorderAll", () => {
  it("moves a field across sections in one mutation", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const first = (await caller.forms.get({ id: form.id })).sections[0]?.id;
    if (!first) throw new Error("seed");
    const second = await caller.sections.add({ formId: form.id });

    const f1 = await caller.fields.add({
      formId: form.id,
      sectionId: first,
      type: "short_text",
      label: "F1",
    });
    const f2 = await caller.fields.add({
      formId: form.id,
      sectionId: first,
      type: "short_text",
      label: "F2",
    });

    await caller.fields.reorderAll({
      formId: form.id,
      sections: [
        { sectionId: first, fieldIds: [f2.id] },
        { sectionId: second.id, fieldIds: [f1.id] },
      ],
    });

    const after = await caller.forms.get({ id: form.id });
    const bySection = new Map(after.sections.map((s) => [s.id, s]));
    expect(bySection.get(first)?.fields.map((f) => f.id)).toEqual([f2.id]);
    expect(bySection.get(second.id)?.fields.map((f) => f.id)).toEqual([f1.id]);
  });
});

describe("conditions router", () => {
  it("add → update → delete happy path", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const full = await caller.forms.get({ id: form.id });
    const sectionId = full.sections[0]?.id;
    if (!sectionId) throw new Error("default section");

    const src = await caller.fields.add({
      formId: form.id,
      sectionId,
      type: "short_text",
      label: "Source",
    });
    const tgt = await caller.fields.add({
      formId: form.id,
      sectionId,
      type: "short_text",
      label: "Target",
    });

    const cond = await caller.conditions.add({
      formId: form.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });
    expect(cond.action).toBe("show");

    const updated = await caller.conditions.update({
      conditionId: cond.id,
      patch: { action: "hide", value: "no" },
    });
    expect(updated.action).toBe("hide");
    expect(updated.value).toBe("no");

    await caller.conditions.delete({ conditionId: cond.id });

    const after = await caller.forms.get({ id: form.id });
    expect(after.conditions).toHaveLength(0);
  });

  it("maps XOR violation to BAD_REQUEST", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const full = await caller.forms.get({ id: form.id });
    const sectionId = full.sections[0]?.id;
    if (!sectionId) throw new Error("default section");
    const src = await caller.fields.add({
      formId: form.id,
      sectionId,
      type: "short_text",
      label: "Source",
    });

    await expect(
      caller.conditions.add({
        formId: form.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: null,
        targetSectionId: null,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("maps a condition delete on a published form to CONFLICT", async () => {
    const caller = serverRouter.createCaller(makeCtx(TEST_USER.id));
    const form = await caller.forms.create(validInput());
    const full = await caller.forms.get({ id: form.id });
    const sectionId = full.sections[0]?.id;
    if (!sectionId) throw new Error("default section");
    const src = await caller.fields.add({
      formId: form.id,
      sectionId,
      type: "short_text",
      label: "Source",
    });
    const tgt = await caller.fields.add({
      formId: form.id,
      sectionId,
      type: "short_text",
      label: "Target",
    });
    const cond = await caller.conditions.add({
      formId: form.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "x",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });
    const current = await caller.forms.get({ id: form.id });
    await caller.forms.publish({ id: form.id, version: current.version });

    await expect(caller.conditions.delete({ conditionId: cond.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
