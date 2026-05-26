import {
  and,
  eq,
  inArray,
  isNotNull,
  lt,
  account as accountTable,
  formFieldsTable,
  formInvitesTable,
  formSectionsTable,
  formViewsTable,
  formsTable,
  fieldConditionsTable,
  fieldOptionsTable,
  inviteBatchesTable,
  responseAnswersTable,
  responseDraftsTable,
  responsesTable,
  session as sessionTable,
  user as userTable,
  verification as verificationTable,
  type Database,
} from "@repo/database";
import { logger } from "@repo/logger";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 30;

export class PurgeService {
  constructor(private readonly db: Database) {}

  async purgeExpiredUsers(retentionDays = DEFAULT_RETENTION_DAYS): Promise<string[]> {
    const cutoff = new Date(Date.now() - retentionDays * MS_PER_DAY);

    const expired = await this.db
      .select({ id: userTable.id })
      .from(userTable)
      .where(and(isNotNull(userTable.deletedAt), lt(userTable.deletedAt, cutoff)));

    const purged: string[] = [];
    for (const u of expired) {
      await this.purgeUser(u.id);
      purged.push(u.id);
    }
    if (purged.length > 0) {
      logger.info("purge cycle complete", { count: purged.length });
    }
    return purged;
  }

  async purgeUser(userId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const formRows = await tx
        .select({ id: formsTable.id })
        .from(formsTable)
        .where(eq(formsTable.userId, userId));
      const formIds = formRows.map((r) => r.id);

      if (formIds.length > 0) {
        const fieldRows = await tx
          .select({ id: formFieldsTable.id })
          .from(formFieldsTable)
          .where(inArray(formFieldsTable.formId, formIds));
        const fieldIds = fieldRows.map((r) => r.id);

        const responseRows = await tx
          .select({ id: responsesTable.id })
          .from(responsesTable)
          .where(inArray(responsesTable.formId, formIds));
        const responseIds = responseRows.map((r) => r.id);

        const inviteRows = await tx
          .select({ id: formInvitesTable.id })
          .from(formInvitesTable)
          .where(inArray(formInvitesTable.formId, formIds));
        const inviteIds = inviteRows.map((r) => r.id);

        // Reverse-topological order — leaves first, FKs are RESTRICT.
        if (inviteIds.length > 0) {
          await tx
            .delete(responseDraftsTable)
            .where(inArray(responseDraftsTable.inviteId, inviteIds));
        }
        if (responseIds.length > 0) {
          await tx
            .delete(responseAnswersTable)
            .where(inArray(responseAnswersTable.responseId, responseIds));
        }
        await tx.delete(formInvitesTable).where(inArray(formInvitesTable.formId, formIds));
        await tx.delete(responsesTable).where(inArray(responsesTable.formId, formIds));
        await tx.delete(formViewsTable).where(inArray(formViewsTable.formId, formIds));
        await tx.delete(inviteBatchesTable).where(inArray(inviteBatchesTable.formId, formIds));
        await tx.delete(fieldConditionsTable).where(inArray(fieldConditionsTable.formId, formIds));
        if (fieldIds.length > 0) {
          await tx.delete(fieldOptionsTable).where(inArray(fieldOptionsTable.fieldId, fieldIds));
        }
        await tx.delete(formFieldsTable).where(inArray(formFieldsTable.formId, formIds));
        await tx.delete(formSectionsTable).where(inArray(formSectionsTable.formId, formIds));
        await tx.delete(formsTable).where(eq(formsTable.userId, userId));
      }

      await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
      await tx.delete(accountTable).where(eq(accountTable.userId, userId));
      // verification rows aren't FK-linked but may carry the user's email
      // as identifier; clear them too in case email-verify tokens still live.
      const [{ email } = { email: null }] = await tx
        .select({ email: userTable.email })
        .from(userTable)
        .where(eq(userTable.id, userId));
      if (email) {
        await tx.delete(verificationTable).where(eq(verificationTable.identifier, email));
      }
      await tx.delete(userTable).where(eq(userTable.id, userId));
    });

    logger.info("user purged", { userId });
  }
}
