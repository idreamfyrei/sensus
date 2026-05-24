import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Tests share one Postgres DB. Run files sequentially so beforeEach
    // truncates can't race against each other.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    // 30s ceiling per test — generous, in case the DB is cold.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
