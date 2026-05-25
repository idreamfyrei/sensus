/**
 * DB-backed invariant tests.
 *
 * These run against a real Postgres (`sensus_test` database) and prove
 * the constraints actually do what the schema claims:
 *   - Partial unique indexes (`UNIQUE … WHERE deleted_at IS NULL`) block
 *     duplicate live identifiers but free up once the holder is soft-deleted.
 *   - The `field_conditions_target_xor` CHECK rejects rows where the target
 *     is missing or doubled.
 *   - FK ON DELETE RESTRICT refuses to orphan child rows.
 *   - The `notDeleted()` helper excludes soft-deleted rows from selects.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Pool } from "pg";

import {
  themesTable,
  formsTable,
  formSectionsTable,
  formFieldsTable,
  fieldConditionsTable,
  user as userTable,
  notDeleted,
} from "../index";

import { createTestDb, setupTestDb, cleanTestDb } from "../test-utils";

// Anchor the test db type at what createTestDb actually returns so the
// `& { $client: Pool }` brand carries through.
type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;

const TEST_USER = {
  id: "user_test_1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: false,
};

beforeAll(async () => {
  const handle = createTestDb();
  db = handle.db;
  pool = handle.pool;
  await setupTestDb(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
});

afterAll(async () => {
  await pool.end();
});

/** Seed a user + a default theme; return the inserted theme row. */
async function seed() {
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
  if (!theme) throw new Error("seed: theme insert returned nothing");
  return { theme };
}

// ──────────────────────────────────────────────────────────────────────────
describe("forms.slug partial-unique invariant", () => {
  it("rejects a duplicate slug among active forms", async () => {
    const { theme } = await seed();
    await db.insert(formsTable).values({
      userId: TEST_USER.id,
      title: "A",
      slug: "shared-slug",
      themeId: theme.id,
    });
    await expect(
      db.insert(formsTable).values({
        userId: TEST_USER.id,
        title: "B",
        slug: "shared-slug",
        themeId: theme.id,
      }),
    ).rejects.toThrow();
  });

  it("allows the slug to be reused once the holder is soft-deleted", async () => {
    const { theme } = await seed();
    const [a] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "A",
        slug: "shared-slug",
        themeId: theme.id,
      })
      .returning();
    if (!a) throw new Error("first insert returned nothing");

    await db.update(formsTable).set({ deletedAt: new Date() }).where(eq(formsTable.id, a.id));

    const [b] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "B",
        slug: "shared-slug",
        themeId: theme.id,
      })
      .returning();
    expect(b?.slug).toBe("shared-slug");
  });
});

// ──────────────────────────────────────────────────────────────────────────
describe("user.email partial-unique invariant", () => {
  it("rejects a duplicate email among active users", async () => {
    await db.insert(userTable).values(TEST_USER);
    await expect(db.insert(userTable).values({ ...TEST_USER, id: "user_b" })).rejects.toThrow();
  });

  it("allows the email to be reused once the holder is soft-deleted", async () => {
    await db.insert(userTable).values(TEST_USER);
    await db.update(userTable).set({ deletedAt: new Date() }).where(eq(userTable.id, TEST_USER.id));

    const [b] = await db
      .insert(userTable)
      .values({ ...TEST_USER, id: "user_b" })
      .returning();
    expect(b?.email).toBe(TEST_USER.email);
  });
});

// ──────────────────────────────────────────────────────────────────────────
describe("field_conditions target XOR CHECK constraint", () => {
  let formId: string;
  let sectionId: string;
  let fieldId: string;

  beforeEach(async () => {
    const { theme } = await seed();
    const [form] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "F",
        slug: "f",
        themeId: theme.id,
      })
      .returning();
    if (!form) throw new Error("form seed failed");
    formId = form.id;

    const [section] = await db.insert(formSectionsTable).values({ formId, order: 0 }).returning();
    if (!section) throw new Error("section seed failed");
    sectionId = section.id;

    const [field] = await db
      .insert(formFieldsTable)
      .values({
        formId,
        sectionId,
        type: "short_text",
        label: "Q",
        order: 0,
      })
      .returning();
    if (!field) throw new Error("field seed failed");
    fieldId = field.id;
  });

  it("accepts a condition with only targetFieldId set", async () => {
    const [row] = await db
      .insert(fieldConditionsTable)
      .values({
        formId,
        sourceFieldId: fieldId,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: fieldId,
      })
      .returning();
    expect(row?.targetFieldId).toBe(fieldId);
  });

  it("accepts a condition with only targetSectionId set", async () => {
    const [row] = await db
      .insert(fieldConditionsTable)
      .values({
        formId,
        sourceFieldId: fieldId,
        operator: "eq",
        value: "x",
        action: "show",
        targetSectionId: sectionId,
      })
      .returning();
    expect(row?.targetSectionId).toBe(sectionId);
  });

  it("rejects a condition with neither target set", async () => {
    await expect(
      db.insert(fieldConditionsTable).values({
        formId,
        sourceFieldId: fieldId,
        operator: "eq",
        value: "x",
        action: "show",
      }),
    ).rejects.toThrow();
  });

  it("rejects a condition with both targets set", async () => {
    await expect(
      db.insert(fieldConditionsTable).values({
        formId,
        sourceFieldId: fieldId,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: fieldId,
        targetSectionId: sectionId,
      }),
    ).rejects.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────
describe("FK ON DELETE RESTRICT", () => {
  it("refuses to hard-delete a form that still has child fields", async () => {
    const { theme } = await seed();
    const [form] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "F",
        slug: "fk-restrict",
        themeId: theme.id,
      })
      .returning();
    if (!form) throw new Error("form seed failed");

    const [section] = await db
      .insert(formSectionsTable)
      .values({ formId: form.id, order: 0 })
      .returning();
    if (!section) throw new Error("section seed failed");

    await db.insert(formFieldsTable).values({
      formId: form.id,
      sectionId: section.id,
      type: "short_text",
      label: "Q",
      order: 0,
    });

    await expect(db.delete(formsTable).where(eq(formsTable.id, form.id))).rejects.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────
describe("notDeleted() helper", () => {
  it("excludes soft-deleted rows from selects", async () => {
    const { theme } = await seed();
    const [live] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "live",
        slug: "live",
        themeId: theme.id,
      })
      .returning();
    const [tombstoned] = await db
      .insert(formsTable)
      .values({
        userId: TEST_USER.id,
        title: "dead",
        slug: "dead",
        themeId: theme.id,
        deletedAt: new Date(),
      })
      .returning();
    if (!live || !tombstoned) throw new Error("seed failed");

    const rows = await db
      .select({ id: formsTable.id, title: formsTable.title })
      .from(formsTable)
      .where(and(eq(formsTable.userId, TEST_USER.id), notDeleted(formsTable.deletedAt)));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(live.id);
  });
});
