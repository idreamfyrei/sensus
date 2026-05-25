import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sensus_test";

/**
 * Spin up a connection to the test DB. Return type is inferred from
 * `drizzle(pool)` so it carries the same `& { $client }` brand as the
 * production `db` instance — services that annotate constructors with
 * `Database` (= typeof db) accept this as a drop-in.
 */
export function createTestDb() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  return { db, pool };
}

type TestDb = ReturnType<typeof createTestDb>["db"];

export async function setupTestDb(db: TestDb): Promise<void> {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
}

export async function cleanTestDb(db: TestDb): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE
      "response_drafts",
      "response_answers",
      "responses",
      "form_invites",
      "invite_batches",
      "form_views",
      "field_conditions",
      "field_options",
      "form_fields",
      "form_sections",
      "forms",
      "account",
      "session",
      "verification",
      "user",
      "themes"
    RESTART IDENTITY CASCADE
  `);
}
