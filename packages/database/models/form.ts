import {
  pgEnum,
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user as userTable } from "../auth-schema";
import { themesTable } from "./theme";

export const formStatusEnum = pgEnum("form_status", [
  "draft",
  "published",
  "unpublished",
  "archived",
]);

export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted", "invite_only"]);

export const formLayoutEnum = pgEnum("form_layout", ["one_per_screen", "single_page"]);

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "restrict" }),

    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),

    slug: varchar("slug", { length: 280 }).notNull(),
    slugIsCustom: boolean("slug_is_custom").notNull().default(false),

    status: formStatusEnum("status").notNull().default("draft"),
    visibility: formVisibilityEnum("visibility").notNull().default("public"),
    layout: formLayoutEnum("layout").notNull().default("one_per_screen"),

    themeId: uuid("theme_id")
      .notNull()
      .references(() => themesTable.id, { onDelete: "restrict" }),

    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),

    passwordHash: text("password_hash"),
    expiresAt: timestamp("expires_at"),
    maxResponses: integer("max_responses"),

    isTemplate: boolean("is_template").notNull().default(false),
    oneResponsePerEmail: boolean("one_response_per_email").notNull().default(false),

    version: integer("version").notNull().default(1),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    userIdx: index("forms_user_id_idx").on(table.userId),
    slugUnique: uniqueIndex("forms_slug_unique")
      .on(table.slug)
      .where(sql`deleted_at IS NULL`),
    statusVisibilityIdx: index("forms_status_visibility_idx").on(table.status, table.visibility),
    userDeletedIdx: index("forms_user_deleted_idx").on(table.userId, table.deletedAt),
  }),
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
