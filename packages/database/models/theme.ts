import { pgTable, uuid, text, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const themeKeyEnum = pgEnum("theme_key", [
  "default",
  "pixel",
  "glitch",
  "terminal",
  "brutalist",
  "glassmorphism",
  "bauhaus",
  "museum",
  "vaporwave",
  "nature_minimal",
  "zen",
]);

export const themesTable = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),

  key: themeKeyEnum("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),

  bg: text("bg").notNull(),
  surface: text("surface").notNull(),
  primary: text("primary").notNull(),
  accent: text("accent").notNull(),
  textColor: text("text_color").notNull(),
  muted: text("muted").notNull(),
  borderStyle: text("border_style").notNull(),
  borderRadius: text("border_radius").notNull(),
  fontHeading: text("font_heading").notNull(),
  fontBody: text("font_body").notNull(),

  effects: jsonb("effects").notNull().default({}),

  isSeeded: boolean("is_seeded").notNull().default(false),
});

export type SelectTheme = typeof themesTable.$inferSelect;
export type InsertTheme = typeof themesTable.$inferInsert;
