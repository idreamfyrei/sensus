import "dotenv/config";
import path from "node:path";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sensus_test";

export function createTestDb(): { db: NodePgDatabase; pool: Pool } {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle(pool);
  return { db, pool };
}

export async function setupTestDb(db: NodePgDatabase): Promise<void> {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "./drizzle") });
}

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
