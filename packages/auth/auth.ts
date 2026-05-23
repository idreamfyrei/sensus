import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  user: {
    additionalFields: {
      deletedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

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
