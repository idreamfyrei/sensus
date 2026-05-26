import { eq, inArray, themesTable, type Database } from "@repo/database";
import { THEME_PRESETS } from "@repo/database/seed-themes";

type Theme = typeof themesTable.$inferSelect;

const PRESET_ORDER = THEME_PRESETS.map((p) => p.key);
const PRESET_KEY_SET: ReadonlySet<string> = new Set(PRESET_ORDER);

export class ThemeNotFoundError extends Error {
  readonly code = "THEME_NOT_FOUND" as const;
  constructor() {
    super("Theme not found");
    this.name = "ThemeNotFoundError";
  }
}

export class ThemeService {
  constructor(private readonly db: Database) {}

  async listPresets(): Promise<Theme[]> {
    const rows = await this.db
      .select()
      .from(themesTable)
      .where(inArray(themesTable.key, [...PRESET_ORDER]));

    const byKey = new Map(rows.map((r) => [r.key, r]));
    return PRESET_ORDER.map((k) => byKey.get(k)).filter((r): r is Theme => r !== undefined);
  }

  async getById(args: { id: string }): Promise<Theme> {
    const [row] = await this.db.select().from(themesTable).where(eq(themesTable.id, args.id));
    if (!row) throw new ThemeNotFoundError();
    return row;
  }

  isPresetId(theme: Theme): boolean {
    return PRESET_KEY_SET.has(theme.key);
  }
}
