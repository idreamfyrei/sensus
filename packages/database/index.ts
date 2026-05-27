import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";

export const db = drizzle(env.DATABASE_URL);

export type Database = typeof db;

export * from "drizzle-orm";

export type { NodePgDatabase } from "drizzle-orm/node-postgres";
export type { Pool } from "pg";

export * from "./schema";

export * from "./helpers";

export * from "./dev-constants";

export default db;
