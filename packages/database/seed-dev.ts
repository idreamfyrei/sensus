/**
 * Dev seed — ensures the Phase 2 hardcoded user + default theme exist in
 * the local DB so `pnpm dev` works without any manual psql.
 *
 * Idempotent: re-running is safe; rows with the same identifier are skipped
 * via ON CONFLICT DO NOTHING. Soft-deleted copies are NOT resurrected —
 * a dropped dev user stays dropped unless you reset the volume.
 *
 * Usage:
 *   pnpm db:seed-dev               # from repo root, via turbo
 *   pnpm --filter @repo/database db:seed-dev    # directly
 */
import { db, user as userTable, themesTable } from "./index";
import { DEV_USER, DEFAULT_THEME_KEY } from "./dev-constants";

async function seed() {
  // Phase 2 dev user. id is fixed; email is partial-unique so this conflicts
  // on the email index even if we ever changed the id.
  await db.insert(userTable).values(DEV_USER).onConflictDoNothing({ target: userTable.id });

  // Default theme row. key is the unique identifier (enum); conflicts on it.
  await db
    .insert(themesTable)
    .values({
      key: DEFAULT_THEME_KEY,
      name: "Default",
      description: "Plain neutral theme used for the Phase 2 vertical slice.",
      bg: "#ffffff",
      surface: "#f5f5f5",
      primary: "#0f172a",
      accent: "#3b82f6",
      textColor: "#0f172a",
      muted: "#64748b",
      borderStyle: "solid",
      borderRadius: "0.5rem",
      fontHeading: "system-ui, sans-serif",
      fontBody: "system-ui, sans-serif",
      isSeeded: true,
    })
    .onConflictDoNothing({ target: themesTable.key });

  console.log(`✅ dev seed complete — user ${DEV_USER.id}, theme key '${DEFAULT_THEME_KEY}'`);
}

seed()
  .catch((err) => {
    console.error("seed-dev failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
