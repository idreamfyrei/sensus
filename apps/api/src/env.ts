import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  // `production` for Next.js / `test` for Vitest / `development` everywhere else.
  // `prod` retained for backwards compat with anything that already sets it.
  NODE_ENV: z.enum(["development", "production", "prod", "test"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
