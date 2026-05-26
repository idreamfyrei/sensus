/**
 * FormService integration tests.
 *
 * Runs against the real `sensus_test` Postgres. Each test starts with an empty
 * DB (truncated in beforeEach), then seeds the minimum state it needs
 * (one user, one theme) before exercising the service.
 *
 * What this proves:
 *   - The class can be constructed with just a db handle → testable in
 *     isolation, no HTTP server required.
 *   - Slug generation is deterministic in shape (kebab + 6-char suffix).
 *   - Ownership checks fire (FormForbiddenError) before any read leaks data.
 *   - Optimistic concurrency catches stale publishes.
 *   - Submit only succeeds against a published form.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { eq, themesTable, user as userTable, type Pool } from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";

// The db instance we hand to FormService — same shape `createTestDb` returns.
type TestDb = ReturnType<typeof createTestDb>["db"];

import {
  FormService,
  FormNotFoundError,
  FormForbiddenError,
  FormVersionMismatchError,
  FormNotPublishedError,
  FormSchemaLockedError,
  ThemeNotFoundForFormError,
} from "./form.service";
import { kebab, generateSlug } from "./slug";

// ─── Fixtures and lifecycle ─────────────────────────────────────────────────

let db: TestDb;
let pool: Pool;
let svc: FormService;

const USER_A = {
  id: "user_a",
  name: "Alice",
  email: "alice@example.com",
  emailVerified: false,
};
const USER_B = {
  id: "user_b",
  name: "Bob",
  email: "bob@example.com",
  emailVerified: false,
};
let themeId: string;

beforeAll(async () => {
  const handle = createTestDb();
  db = handle.db;
  pool = handle.pool;
  await setupTestDb(db);
  svc = new FormService(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
  await db.insert(userTable).values([USER_A, USER_B]);
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

// ─── Slug helpers (pure unit) ───────────────────────────────────────────────

describe("slug.kebab", () => {
  it("kebab-cases a plain title", () => {
    expect(kebab("My Anime Survey")).toBe("my-anime-survey");
  });

  it("strips accents", () => {
    expect(kebab("Café Naïve")).toBe("cafe-naive");
  });

  it("collapses runs of special chars to a single hyphen", () => {
    expect(kebab("Hello!!!  World  ??")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(kebab("---hi---")).toBe("hi");
  });
});

describe("slug.generateSlug", () => {
  it("appends a 6-char suffix to the kebab'd title", () => {
    expect(generateSlug("Anime Survey")).toMatch(/^anime-survey-[a-z0-9]{6}$/);
  });

  it("falls back to 'form' when the title slugs to nothing", () => {
    expect(generateSlug("!!!")).toMatch(/^form-[a-z0-9]{6}$/);
  });

  it("produces distinct slugs for repeated calls (suffix entropy)", () => {
    const slugs = new Set([generateSlug("test"), generateSlug("test"), generateSlug("test")]);
    expect(slugs.size).toBe(3);
  });
});

// ─── FormService.create ─────────────────────────────────────────────────────

describe("FormService.create", () => {
  it("creates a draft form with a generated slug and version 1", async () => {
    const form = await svc.create({
      userId: USER_A.id,
      input: { title: "Anime Survey", themeId },
    });

    expect(form.title).toBe("Anime Survey");
    expect(form.status).toBe("draft");
    expect(form.slug).toMatch(/^anime-survey-[a-z0-9]{6}$/);
    expect(form.version).toBe(1);
    expect(form.userId).toBe(USER_A.id);
  });
});

// ─── FormService.getById ────────────────────────────────────────────────────

describe("FormService.getById", () => {
  it("returns the form when called by the owner", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    const fetched = await svc.getById({ id: created.id, userId: USER_A.id });
    expect(fetched.id).toBe(created.id);
  });

  it("throws FormForbiddenError when called by a non-owner", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(svc.getById({ id: created.id, userId: USER_B.id })).rejects.toThrow(
      FormForbiddenError,
    );
  });

  it("throws FormNotFoundError when the id doesn't exist", async () => {
    await expect(
      svc.getById({ id: "11111111-1111-4111-8111-111111111111", userId: USER_A.id }),
    ).rejects.toThrow(FormNotFoundError);
  });

  it("does not return soft-deleted forms (notDeleted is applied)", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });
    // Mark as soft-deleted via raw drizzle (no service method for this yet).
    const { eq, formsTable } = await import("@repo/database");
    await db.update(formsTable).set({ deletedAt: new Date() }).where(eq(formsTable.id, created.id));

    await expect(svc.getById({ id: created.id, userId: USER_A.id })).rejects.toThrow(
      FormNotFoundError,
    );
  });
});

// ─── FormService.listByUser ─────────────────────────────────────────────────

describe("FormService.listByUser", () => {
  it("returns only the calling user's forms", async () => {
    const mk = (title: string, userId: string) =>
      svc.create({
        userId,
        input: { title, themeId },
      });

    await mk("A1", USER_A.id);
    await mk("A2", USER_A.id);
    await mk("B1", USER_B.id);

    const aForms = await svc.listByUser({ userId: USER_A.id });
    expect(aForms).toHaveLength(2);
    expect(aForms.every((f) => f.userId === USER_A.id)).toBe(true);
  });
});

// ─── FormService.publish ────────────────────────────────────────────────────

describe("FormService.publish", () => {
  it("flips status to published and bumps version", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    const published = await svc.publish({
      id: created.id,
      userId: USER_A.id,
      version: created.version,
    });

    expect(published.status).toBe("published");
    expect(published.version).toBe(created.version + 1);
  });

  it("rejects publish when the caller-supplied version is stale", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(
      svc.publish({ id: created.id, userId: USER_A.id, version: created.version + 99 }),
    ).rejects.toThrow(FormVersionMismatchError);
  });

  it("rejects publish from a non-owner", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(
      svc.publish({ id: created.id, userId: USER_B.id, version: created.version }),
    ).rejects.toThrow(FormForbiddenError);
  });
});

// ─── FormService.setTheme ───────────────────────────────────────────────────

describe("FormService.setTheme", () => {
  async function seedAltTheme(key: "pixel"): Promise<string> {
    const [row] = await db
      .insert(themesTable)
      .values({
        key,
        name: "Pixel",
        bg: "#000",
        surface: "#111",
        primary: "#f8e71c",
        accent: "#e94560",
        textColor: "#eee",
        muted: "#888",
        borderStyle: "solid",
        borderRadius: "0px",
        fontHeading: "monospace",
        fontBody: "monospace",
      })
      .returning();
    if (!row) throw new Error("alt theme seed failed");
    return row.id;
  }

  it("updates the form's themeId and bumps version", async () => {
    const altId = await seedAltTheme("pixel");
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    const updated = await svc.setTheme({
      id: created.id,
      userId: USER_A.id,
      themeId: altId,
      version: created.version,
    });

    expect(updated.themeId).toBe(altId);
    expect(updated.version).toBe(created.version + 1);
  });

  it("rejects setTheme on a published form (schema lock)", async () => {
    const altId = await seedAltTheme("pixel");
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });
    await svc.publish({ id: created.id, userId: USER_A.id, version: created.version });

    await expect(
      svc.setTheme({
        id: created.id,
        userId: USER_A.id,
        themeId: altId,
        version: created.version + 1,
      }),
    ).rejects.toThrow(FormSchemaLockedError);
  });

  it("rejects setTheme with a stale version", async () => {
    const altId = await seedAltTheme("pixel");
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(
      svc.setTheme({
        id: created.id,
        userId: USER_A.id,
        themeId: altId,
        version: created.version + 99,
      }),
    ).rejects.toThrow(FormVersionMismatchError);
  });

  it("throws ThemeNotFoundForFormError when the theme id doesn't exist", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(
      svc.setTheme({
        id: created.id,
        userId: USER_A.id,
        themeId: "11111111-1111-4111-8111-111111111111",
        version: created.version,
      }),
    ).rejects.toThrow(ThemeNotFoundForFormError);
  });

  it("rejects setTheme from a non-owner", async () => {
    const altId = await seedAltTheme("pixel");
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "X", themeId },
    });

    await expect(
      svc.setTheme({
        id: created.id,
        userId: USER_B.id,
        themeId: altId,
        version: created.version,
      }),
    ).rejects.toThrow(FormForbiddenError);
  });
});

// ─── FormService.submit (public path) ───────────────────────────────────────

describe("FormService.submit", () => {
  it("creates a response when the form is published", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "Live", themeId },
    });
    await svc.publish({ id: created.id, userId: USER_A.id, version: created.version });

    const result = await svc.submit({ slug: created.slug, answers: [] });
    expect(result.responseId).toBeDefined();
  });

  it("rejects submission to a draft form", async () => {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "Draft", themeId },
    });

    await expect(svc.submit({ slug: created.slug, answers: [] })).rejects.toThrow(
      FormNotPublishedError,
    );
  });

  it("throws FormNotFoundError for an unknown slug", async () => {
    await expect(svc.submit({ slug: "nonexistent-xyzabc", answers: [] })).rejects.toThrow(
      FormNotFoundError,
    );
  });
});

describe("FormService.submit with conditions", () => {
  async function setupFormWithTwoFields() {
    const created = await svc.create({
      userId: USER_A.id,
      input: { title: "Conditional", themeId },
    });
    const {
      formsTable: ft,
      fieldConditionsTable,
      formSectionsTable: fst,
      formFieldsTable: fft,
    } = await import("@repo/database");
    void ft;
    const [section] = await db.select().from(fst).where(eq(fst.formId, created.id));
    if (!section) throw new Error("section seed");
    const [src] = await db
      .insert(fft)
      .values({
        formId: created.id,
        sectionId: section.id,
        type: "short_text",
        label: "Source",
        order: 0,
      })
      .returning();
    if (!src) throw new Error("src seed");
    const [tgt] = await db
      .insert(fft)
      .values({
        formId: created.id,
        sectionId: section.id,
        type: "short_text",
        label: "Target",
        order: 1,
      })
      .returning();
    if (!tgt) throw new Error("tgt seed");
    return { form: created, src, tgt, fieldConditionsTable };
  }

  it("skips hidden fields' answers and ignores their validation", async () => {
    const { form, src, tgt, fieldConditionsTable } = await setupFormWithTwoFields();
    await db.insert(fieldConditionsTable).values({
      formId: form.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
    });
    await svc.publish({ id: form.id, userId: USER_A.id, version: form.version });

    const result = await svc.submit({
      slug: form.slug,
      answers: [
        { fieldId: src.id, value: "no" },
        { fieldId: tgt.id, value: "this should be ignored" },
      ],
    });
    expect(result.responseId).toBeDefined();

    const { responseAnswersTable } = await import("@repo/database");
    const rows = await db
      .select()
      .from(responseAnswersTable)
      .where(eq(responseAnswersTable.responseId, result.responseId));
    expect(rows.map((r) => r.formFieldId)).toEqual([src.id]);
  });

  it("enforces dynamic required from a require condition", async () => {
    const { form, src, tgt, fieldConditionsTable } = await setupFormWithTwoFields();
    await db.insert(fieldConditionsTable).values({
      formId: form.id,
      sourceFieldId: src.id,
      operator: "not_empty",
      action: "require",
      targetFieldId: tgt.id,
    });
    await svc.publish({ id: form.id, userId: USER_A.id, version: form.version });

    await expect(
      svc.submit({
        slug: form.slug,
        answers: [{ fieldId: src.id, value: "filled" }],
      }),
    ).rejects.toMatchObject({ code: "INVALID_ANSWER" });
  });

  it("hides a section via section-target condition; section's fields' answers are ignored", async () => {
    const { form, src, fieldConditionsTable } = await setupFormWithTwoFields();
    const { formSectionsTable: fst, formFieldsTable: fft } = await import("@repo/database");
    const [s2] = await db.insert(fst).values({ formId: form.id, order: 1 }).returning();
    if (!s2) throw new Error("s2 seed");
    const [tgt2] = await db
      .insert(fft)
      .values({
        formId: form.id,
        sectionId: s2.id,
        type: "short_text",
        label: "Inside hidden section",
        order: 0,
      })
      .returning();
    if (!tgt2) throw new Error("tgt2 seed");

    await db.insert(fieldConditionsTable).values({
      formId: form.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "hide",
      action: "hide",
      targetSectionId: s2.id,
    });
    await svc.publish({ id: form.id, userId: USER_A.id, version: form.version });

    const result = await svc.submit({
      slug: form.slug,
      answers: [
        { fieldId: src.id, value: "hide" },
        { fieldId: tgt2.id, value: "this section is hidden" },
      ],
    });

    const { responseAnswersTable } = await import("@repo/database");
    const rows = await db
      .select()
      .from(responseAnswersTable)
      .where(eq(responseAnswersTable.responseId, result.responseId));
    expect(rows.map((r) => r.formFieldId)).toEqual([src.id]);
  });
});
