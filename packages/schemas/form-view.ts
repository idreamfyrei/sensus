import { createSelectSchema } from "drizzle-zod";
import { formViewsTable } from "@repo/database";
import { z } from "zod";

// Recorded server-side on every public /f/[slug] load; no client write path.
export const formViewSchema = createSelectSchema(formViewsTable);

export type FormView = z.infer<typeof formViewSchema>;
