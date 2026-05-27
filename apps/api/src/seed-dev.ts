import {
  db,
  eq,
  user as userTable,
  themesTable,
  DEV_USER_CREDENTIALS,
  DEFAULT_THEME_KEY,
} from "@repo/database";
import { seedThemes } from "@repo/database/seed-themes";
import { auth } from "@repo/auth";

async function seed() {
  const [existing] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, DEV_USER_CREDENTIALS.email))
    .limit(1);

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        name: DEV_USER_CREDENTIALS.name,
        email: DEV_USER_CREDENTIALS.email,
        password: DEV_USER_CREDENTIALS.password,
      },
    });
  }

  await db
    .insert(themesTable)
    .values({
      key: DEFAULT_THEME_KEY,
      name: "Default",
      description: "Plain neutral theme used for local development.",
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

  const { presetCount } = await seedThemes(db);

  console.log(
    `✅ dev seed complete — user ${DEV_USER_CREDENTIALS.email}, theme key '${DEFAULT_THEME_KEY}', ${presetCount} presets`,
  );
}

seed()
  .catch((err) => {
    console.error("seed-dev failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
