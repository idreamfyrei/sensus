import "dotenv/config";
import path from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sensus_test";

/**
 * Spin up a connection to the test DB. Returns `{ db, pool }` — the pool
 * must be `end()`-ed in `afterAll` so vitest can exit cleanly.
 */
export function createTestDb(): { db: NodePgDatabase; pool: Pool } {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  return { db, pool };
}

/**
 * Apply every migration in `packages/database/drizzle/` to the test DB.
 * Safe to call repeatedly — drizzle skips already-applied migrations.
 */
export async function setupTestDb(db: NodePgDatabase): Promise<void> {
  // The database package's tsconfig is CommonJS, so __dirname is native.
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
}

/**
 * Wipe every row from every table, in one statement, before each test.
 * Uses CASCADE because our FKs are RESTRICT — TRUNCATE without CASCADE
 * would fail on any referenced row. CASCADE here is *truncation* cascade
 * (table-level), not the runtime DELETE cascade we've forbidden.
 */
export async function cleanTestDb(db: NodePgDatabase): Promise<void> {
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
