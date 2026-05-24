import { createSelectSchema } from "drizzle-zod";
import { responsesTable } from "@repo/database";
import { z } from "zod";

// Responses are built server-side from public submits; no client-side create input.
export const responseSchema = createSelectSchema(responsesTable);

export type Response = z.infer<typeof responseSchema>;
