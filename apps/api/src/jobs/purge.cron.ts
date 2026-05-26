import cron from "node-cron";
import { db } from "@repo/database";
import { PurgeService } from "@repo/services";
import { logger } from "@repo/logger";

const purge = new PurgeService(db);

// Daily at 03:00 server time.
const SCHEDULE = "0 3 * * *";

export function startPurgeCron() {
  cron.schedule(SCHEDULE, async () => {
    try {
      const purged = await purge.purgeExpiredUsers();
      if (purged.length > 0) {
        logger.info("purge cron ran", { purgedCount: purged.length });
      }
    } catch (err) {
      logger.error("purge cron failed", { err });
    }
  });
  logger.info(`purge cron scheduled: ${SCHEDULE}`);
}
