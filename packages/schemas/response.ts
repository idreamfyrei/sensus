import { createSelectSchema } from "drizzle-zod";
import { responsesTable } from "@repo/database";
import { z } from "zod";

export const responseSchema = createSelectSchema(responsesTable);

export type Response = z.infer<typeof responseSchema>;
