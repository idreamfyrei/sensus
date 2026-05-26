import { eq, session as sessionTable, user as userTable, type Database } from "@repo/database";
import { logger } from "@repo/logger";

export class AccountNotFoundError extends Error {
  readonly code = "ACCOUNT_NOT_FOUND" as const;
  constructor() {
    super("Account not found");
    this.name = "AccountNotFoundError";
  }
}

export class AccountService {
  constructor(private readonly db: Database) {}

  /**
   * Soft-delete a user account and revoke every active session. The user
   * row stays in the DB with `deletedAt = now()`; the Purge cron hard-deletes
   * it (and all owned forms/responses/etc.) 30 days later.
   */
  async deleteSelf(args: { userId: string }): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(userTable)
        .set({ deletedAt: new Date() })
        .where(eq(userTable.id, args.userId))
        .returning({ id: userTable.id });

      if (!updated) throw new AccountNotFoundError();

      await tx.delete(sessionTable).where(eq(sessionTable.userId, args.userId));
    });

    logger.info("account soft-deleted", { userId: args.userId });
  }
}
