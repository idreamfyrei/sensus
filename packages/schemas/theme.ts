import { createSelectSchema } from "drizzle-zod";
import { themesTable } from "@repo/database";
import { z } from "zod";

export const themeSchema = createSelectSchema(themesTable);

export type Theme = z.infer<typeof themeSchema>;
