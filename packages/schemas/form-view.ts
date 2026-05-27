import { createSelectSchema } from "drizzle-zod";
import { formViewsTable } from "@repo/database";
import { z } from "zod";

export const formViewSchema = createSelectSchema(formViewsTable);

export type FormView = z.infer<typeof formViewSchema>;
