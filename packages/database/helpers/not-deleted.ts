import { isNull, type Column, type SQL } from "drizzle-orm";

// Soft-delete read filter: db.select().from(t).where(and(..., notDeleted(t.deletedAt)))
export function notDeleted(deletedAt: Column): SQL<unknown> {
  return isNull(deletedAt);
}
