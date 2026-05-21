import { pgTable, uuid, varchar, timestamp, boolean, text, index } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    clerkUserId: text("clerk_user_id").notNull().unique(),

    fullName: varchar("full_name", { length: 80 }).notNull(),

    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false),

    profileImageUrl: text("profile_image_url"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("users_clerk_user_id_idx").on(table.clerkUserId)],
);

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
