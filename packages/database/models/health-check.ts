import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
export const healthCheckTable = pgTable("health_check", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow(),
});
