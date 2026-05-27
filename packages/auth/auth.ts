import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, user, session, account, verification } from "@repo/database";

const authSchema = { user, session, account, verification };

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_OAUTH_CLIENT_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),

  user: {
    additionalFields: {
      deletedAt: { type: "date", required: false, input: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  ...(googleEnabled && {
    socialProviders: {
      google: {
        clientId: googleClientId as string,
        clientSecret: googleClientSecret as string,
      },
    },
  }),

  databaseHooks: {
    user: {
      delete: {
        before: async () => {
          throw new Error("Direct user hard-delete is forbidden");
        },
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET ?? "",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export type Auth = typeof auth;
