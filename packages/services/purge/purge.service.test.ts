import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  eq,
  formsTable,
  formSectionsTable,
  formFieldsTable,
  responsesTable,
  themesTable,
  user as userTable,
  type Pool,
} from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";
import { PurgeService } from "./purge.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let svc: PurgeService;

const USER = {
  id: "user_purge",
  name: "Purge User",
  email: "purge@example.com",
  emailVerified: false,
};

beforeAll(async () => {
  const h = createTestDb();
  db = h.db;
  pool = h.pool;
  await setupTestDb(db);
  svc = new PurgeService(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
});

afterAll(async () => {
  await pool.end();
});

describe("PurgeService", () => {
  it("hard-deletes a user with forms/fields/responses; leaves other users alone", async () => {
    // Seed two users; only USER is expired.
    await db.insert(userTable).values([
      { ...USER, deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
      {
        id: "user_keep",
        name: "Keep",
        email: "keep@example.com",
        emailVerified: false,
      },
    ]);

    const [theme] = await db
      .insert(themesTable)
      .values({
        key: "default",
        name: "Default",
        bg: "#fff",
        surface: "#fff",
        primary: "#000",
        accent: "#000",
        textColor: "#000",
        muted: "#888",
        borderStyle: "solid",
        borderRadius: "0.5rem",
        fontHeading: "sans",
        fontBody: "sans",
      })
      .returning();
    if (!theme) throw new Error("theme seed failed");

    const [form] = await db
      .insert(formsTable)
      .values({
        userId: USER.id,
        title: "Doomed",
        slug: "doomed",
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
    await db.insert(responsesTable).values({ formId: form.id });

    // Run the purge.
    const purged = await svc.purgeExpiredUsers(30);

    expect(purged).toEqual([USER.id]);

    // User & all owned rows gone.
    const userRows = await db.select().from(userTable).where(eq(userTable.id, USER.id));
    expect(userRows).toHaveLength(0);

    const formRows = await db.select().from(formsTable).where(eq(formsTable.id, form.id));
    expect(formRows).toHaveLength(0);

    // Other user untouched.
    const keep = await db.select().from(userTable).where(eq(userTable.id, "user_keep"));
    expect(keep).toHaveLength(1);
  });

  it("ignores users whose deletedAt is within the retention window", async () => {
    await db.insert(userTable).values({
      ...USER,
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5d ago
    });

    const purged = await svc.purgeExpiredUsers(30);
    expect(purged).toEqual([]);

    const rows = await db.select().from(userTable).where(eq(userTable.id, USER.id));
    expect(rows).toHaveLength(1);
  });
});
