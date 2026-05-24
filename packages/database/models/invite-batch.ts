import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const inviteBatchesTable = pgTable(
  "invite_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "restrict" }),

    cloudinaryUrl: text("cloudinary_url").notNull(),
    originalFilename: text("original_filename").notNull(),

    totalCount: integer("total_count").notNull(),
    sentCount: integer("sent_count").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    formCreatedIdx: index("invite_batches_form_created_idx").on(table.formId, table.createdAt),
  }),
);

export type SelectInviteBatch = typeof inviteBatchesTable.$inferSelect;
export type InsertInviteBatch = typeof inviteBatchesTable.$inferInsert;
