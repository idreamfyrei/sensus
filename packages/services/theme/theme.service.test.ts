import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { themesTable, type Pool } from "@repo/database";
import { seedThemes, THEME_PRESETS } from "@repo/database/seed-themes";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";

import { ThemeService, ThemeNotFoundError } from "./theme.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let svc: ThemeService;

beforeAll(async () => {
  const handle = createTestDb();
  db = handle.db;
  pool = handle.pool;
  await setupTestDb(db);
  svc = new ThemeService(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
});

afterAll(async () => {
  await pool.end();
});

describe("ThemeService.listPresets", () => {
  it("returns the 10 presets in declaration order", async () => {
    await seedThemes(db);
    const themes = await svc.listPresets();
    expect(themes).toHaveLength(10);
    expect(themes.map((t) => t.key)).toEqual(THEME_PRESETS.map((p) => p.key));
  });

  it("excludes the `default` bootstrap theme", async () => {
    await db.insert(themesTable).values({
      key: "default",
      name: "Default",
      bg: "#ffffff",
      surface: "#ffffff",
      primary: "#000",
      accent: "#000",
      textColor: "#000",
      muted: "#888",
      borderStyle: "solid",
      borderRadius: "0.5rem",
      fontHeading: "sans-serif",
      fontBody: "sans-serif",
    });
    await seedThemes(db);

    const themes = await svc.listPresets();
    expect(themes.map((t) => t.key)).not.toContain("default");
    expect(themes).toHaveLength(10);
  });

  it("returns an empty array when no themes are seeded", async () => {
    const themes = await svc.listPresets();
    expect(themes).toEqual([]);
  });
});

describe("ThemeService.getById", () => {
  it("returns the theme row by id", async () => {
    await seedThemes(db);
    const [first] = await svc.listPresets();
    if (!first) throw new Error("expected at least one preset");

    const fetched = await svc.getById({ id: first.id });
    expect(fetched.id).toBe(first.id);
    expect(fetched.key).toBe(first.key);
  });

  it("throws ThemeNotFoundError for an unknown id", async () => {
    await expect(svc.getById({ id: "11111111-1111-4111-8111-111111111111" })).rejects.toThrow(
      ThemeNotFoundError,
    );
  });
});
