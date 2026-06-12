import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@repo/database";

async function main() {
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "packages/database/drizzle"),
  });

  console.log("database migrations complete");
}

main()
  .catch((err) => {
    console.error("database migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
