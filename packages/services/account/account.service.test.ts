import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { eq, user as userTable, session as sessionTable, type Pool } from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";
import { AccountService } from "./account.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let svc: AccountService;

const USER = {
  id: "user_acct",
  name: "Account User",
  email: "acct@example.com",
  emailVerified: false,
};

beforeAll(async () => {
  const h = createTestDb();
  db = h.db;
  pool = h.pool;
  await setupTestDb(db);
  svc = new AccountService(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
  await db.insert(userTable).values(USER);
  await db.insert(sessionTable).values({
    id: "sess_1",
    token: "tok_1",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    userId: USER.id,
    updatedAt: new Date(),
  });
});

afterAll(async () => {
  await pool.end();
});

describe("AccountService.deleteSelf", () => {
  it("sets deletedAt on the user and removes all their sessions", async () => {
    await svc.deleteSelf({ userId: USER.id });

    const [row] = await db.select().from(userTable).where(eq(userTable.id, USER.id));
    expect(row?.deletedAt).toBeInstanceOf(Date);

    const sessions = await db.select().from(sessionTable).where(eq(sessionTable.userId, USER.id));
    expect(sessions).toHaveLength(0);
  });
});
