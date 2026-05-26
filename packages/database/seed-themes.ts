/**
 * Seed module for the 10 plan-defined theme presets (Phase 4.6).
 *
 * Idempotent: re-running is a no-op via `onConflictDoNothing(themes.key)`.
 * Consumed by `apps/api/src/seed-dev.ts` and (Phase 8) the full demo seed.
 *
 * The `default` theme is NOT in this list — it lives in `seed-dev.ts` and
 * is a dev-bootstrap row, not a user-visible preset.
 */
import type { InsertTheme } from "./models/theme";
import { themesTable } from "./models/theme";
import type { Database } from "./index";

/**
 * Boolean visual-effect flags consumed by the page-wide theming layer
 * (Phase 4.8). Stored in the `themes.effects` jsonb column.
 */
export type ThemeEffects = {
  scanlines?: boolean;
  glow?: boolean;
  blur?: boolean;
  grain?: boolean;
  halftone?: boolean;
};

/**
 * The 10 presets. Each is a coherent design-token set hand-tuned for
 * readability when painted page-wide on `/f/[slug]`. Effects flags match
 * the vibe (scanlines for terminal/pixel, blur for glassmorphism, etc.).
 *
 * Color choices target WCAG-AA contrast for body text on surfaces.
 */
export const THEME_PRESETS = [
  {
    key: "pixel",
    name: "Pixel",
    description: "Retro 8-bit. Blocky panels, bitmap-feel monospace, faint scanlines.",
    bg: "#1a1a2e",
    surface: "#16213e",
    primary: "#f8e71c",
    accent: "#e94560",
    textColor: "#eaeaea",
    muted: "#8a8aa3",
    borderStyle: "solid",
    borderRadius: "0px",
    fontHeading: '"Press Start 2P", "VT323", monospace',
    fontBody: '"VT323", ui-monospace, monospace',
    effects: { scanlines: true } satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "glitch",
    name: "Glitch",
    description: "Neon on dark. RGB-shifted edges, low-key glow on focus.",
    bg: "#0d0d12",
    surface: "#15151c",
    primary: "#ff00aa",
    accent: "#00ffd5",
    textColor: "#f5f5fa",
    muted: "#6e6e8a",
    borderStyle: "solid",
    borderRadius: "2px",
    fontHeading: '"IBM Plex Mono", "JetBrains Mono", monospace',
    fontBody: '"IBM Plex Sans", system-ui, sans-serif',
    effects: { glow: true } satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "terminal",
    name: "Terminal",
    description: "Green-on-black CRT. Monospace throughout, persistent scanlines.",
    bg: "#000000",
    surface: "#0a0f0a",
    primary: "#33ff66",
    accent: "#a3ffb3",
    textColor: "#c8ffd0",
    muted: "#5a8a64",
    borderStyle: "solid",
    borderRadius: "0px",
    fontHeading: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
    fontBody: '"JetBrains Mono", ui-monospace, monospace',
    effects: { scanlines: true, glow: true } satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "brutalist",
    name: "Brutalist",
    description: "Harsh contrast. Thick borders, zero radius, structural type.",
    bg: "#f4f4f4",
    surface: "#ffffff",
    primary: "#000000",
    accent: "#ff3b1f",
    textColor: "#000000",
    muted: "#555555",
    borderStyle: "solid",
    borderRadius: "0px",
    fontHeading: '"Space Grotesk", "Helvetica Neue", sans-serif',
    fontBody: '"Inter", "Helvetica Neue", sans-serif',
    effects: {} satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "glassmorphism",
    name: "Glassmorphism",
    description: "Translucent panels over a soft gradient. Backdrop blur on surfaces.",
    bg: "linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)",
    surface: "rgba(255, 255, 255, 0.45)",
    primary: "#1e3a8a",
    accent: "#7c3aed",
    textColor: "#0f172a",
    muted: "#475569",
    borderStyle: "solid",
    borderRadius: "1rem",
    fontHeading: '"Inter", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    effects: { blur: true } satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "bauhaus",
    name: "Bauhaus",
    description: "Primary colors, geometric forms, confident sans-serif.",
    bg: "#f5f1e8",
    surface: "#ffffff",
    primary: "#d62828",
    accent: "#003049",
    textColor: "#1d1d1d",
    muted: "#6b6b6b",
    borderStyle: "solid",
    borderRadius: "0.25rem",
    fontHeading: '"Archivo Black", "Futura", sans-serif',
    fontBody: '"Archivo", "Futura", sans-serif',
    effects: {} satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "museum",
    name: "Museum",
    description: "Refined neutrals. Serif headings, generous margins, gallery quiet.",
    bg: "#faf7f2",
    surface: "#ffffff",
    primary: "#2c2418",
    accent: "#8b6f47",
    textColor: "#2c2418",
    muted: "#8a7e6b",
    borderStyle: "solid",
    borderRadius: "0.125rem",
    fontHeading: '"Playfair Display", "Georgia", serif',
    fontBody: '"Source Serif Pro", "Georgia", serif',
    effects: {} satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "vaporwave",
    name: "Vaporwave",
    description: "Pink and cyan gradients, soft grain, late-90s mall energy.",
    bg: "linear-gradient(135deg, #ff71ce 0%, #01cdfe 100%)",
    surface: "#1a0033",
    primary: "#ff71ce",
    accent: "#05ffa1",
    textColor: "#fffb96",
    muted: "#b967ff",
    borderStyle: "double",
    borderRadius: "0.75rem",
    fontHeading: '"Major Mono Display", "Courier New", monospace',
    fontBody: '"Space Mono", "Courier New", monospace',
    effects: { grain: true, glow: true } satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "nature_minimal",
    name: "Nature Minimal",
    description: "Earthy greens and creams. Calm sans-serif, generous whitespace.",
    bg: "#f4f1ea",
    surface: "#ffffff",
    primary: "#3a5a40",
    accent: "#a3b18a",
    textColor: "#1b2e1f",
    muted: "#7a8772",
    borderStyle: "solid",
    borderRadius: "0.5rem",
    fontHeading: '"Fraunces", "Georgia", serif',
    fontBody: '"Inter", system-ui, sans-serif',
    effects: {} satisfies ThemeEffects,
    isSeeded: true,
  },
  {
    key: "anime",
    name: "Anime",
    description: "Bold panels, halftone dots, dynamic accents. Shōnen energy.",
    bg: "#fff8e7",
    surface: "#ffffff",
    primary: "#1a1a1a",
    accent: "#e63946",
    textColor: "#0a0a0a",
    muted: "#5a5a5a",
    borderStyle: "solid",
    borderRadius: "0.5rem",
    fontHeading: '"Bangers", "Bebas Neue", "Impact", sans-serif',
    fontBody: '"M PLUS Rounded 1c", "Hiragino Maru Gothic Pro", sans-serif',
    effects: { halftone: true } satisfies ThemeEffects,
    isSeeded: true,
  },
] as const satisfies readonly InsertTheme[];

/**
 * Idempotent insert. Re-running has no effect for keys that already exist.
 * Returns the count of rows the caller intended to insert (the catalog size),
 * not the count of new rows — Drizzle's `onConflictDoNothing` doesn't expose
 * that without a `returning()` that we don't need.
 */
export async function seedThemes(db: Database): Promise<{ presetCount: number }> {
  await db
    .insert(themesTable)
    .values([...THEME_PRESETS])
    .onConflictDoNothing({ target: themesTable.key });

  return { presetCount: THEME_PRESETS.length };
}
