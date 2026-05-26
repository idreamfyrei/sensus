import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { inArray } from "drizzle-orm";
import type { Pool } from "pg";

import { themesTable } from "../index";
import { THEME_PRESETS, seedThemes } from "../seed-themes";
import { createTestDb, setupTestDb, cleanTestDb } from "../test-utils";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;

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

describe("seedThemes()", () => {
  const expectedKeys = [
    "pixel",
    "glitch",
    "terminal",
    "brutalist",
    "glassmorphism",
    "bauhaus",
    "museum",
    "vaporwave",
    "nature_minimal",
    "anime",
  ] as const;

  it("inserts all 10 preset rows on first run", async () => {
    const { presetCount } = await seedThemes(db);
    expect(presetCount).toBe(10);

    const rows = await db
      .select({ key: themesTable.key })
      .from(themesTable)
      .where(inArray(themesTable.key, [...expectedKeys]));

    const keys = rows.map((r) => r.key).sort();
    expect(keys).toEqual([...expectedKeys].sort());
  });

  it("is idempotent — second run inserts no extra rows", async () => {
    await seedThemes(db);
    await seedThemes(db);

    const rows = await db
      .select({ key: themesTable.key })
      .from(themesTable)
      .where(inArray(themesTable.key, [...expectedKeys]));

    expect(rows).toHaveLength(10);
  });

  it("every preset has non-empty design tokens", () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.bg).toBeTruthy();
      expect(preset.surface).toBeTruthy();
      expect(preset.primary).toBeTruthy();
      expect(preset.accent).toBeTruthy();
      expect(preset.textColor).toBeTruthy();
      expect(preset.muted).toBeTruthy();
      expect(preset.borderStyle).toBeTruthy();
      expect(preset.borderRadius).toBeTruthy();
      expect(preset.fontHeading).toBeTruthy();
      expect(preset.fontBody).toBeTruthy();
      expect(preset.name).toBeTruthy();
    }
  });

  it("preset keys are unique within the catalog", () => {
    const keys = THEME_PRESETS.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
