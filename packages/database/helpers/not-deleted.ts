import { isNull, type Column, type SQL } from "drizzle-orm";

/**
 * Soft-delete-aware read filter. Wrap your queries with this in every
 * service layer:
 *
 *   db.select().from(forms).where(and(eq(forms.id, id), notDeleted(forms.deletedAt)))
 *
 * Centralizing the predicate makes the "forgot to filter" bug impossible to
 * miss in code review (the call should appear in every read path).
 */
export function notDeleted(deletedAt: Column): SQL<unknown> {
  return isNull(deletedAt);
}
