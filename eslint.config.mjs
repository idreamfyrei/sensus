import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    // Type-aware rules require per-package tsconfig; enforced via `pnpm lint` (turbo).
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
    ],
  },
];
