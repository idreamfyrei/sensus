export const DEV_USER_CREDENTIALS = {
  name: "Dev User",
  email: "dev@sensus.local",
  password: "DevPassword123!",
} as const;

export const DEFAULT_THEME_KEY = "default" as const;

/**
 * Demo creators seeded by `pnpm db:seed-demo`. These accounts own the
 * curated showcase forms used in /explore, /templates, and the dashboard
 * walkthrough. The credentials are deliberately memorable so judges can
 * sign in without reaching for a notes app.
 */
export const DEMO_CREATORS = {
  admin: {
    name: "Sensus Studio",
    email: "demo@sensus.app",
    password: "SeeSensus!",
  },
  guest: {
    name: "Visiting Judge",
    email: "judge@sensus.app",
    password: "SeeSensus!",
  },
} as const;
