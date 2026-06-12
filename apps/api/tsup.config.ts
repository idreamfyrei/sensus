import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/migrate.ts", "./src/seed-demo.ts", "./src/seed-dev.ts"],
  noExternal: [/^@repo\//],
  splitting: false,
  bundle: true,
  outDir: "./dist",
  clean: true,
  env: { IS_SERVER_BUILD: "true" },
  loader: { ".json": "copy" },
  minify: true,
  sourcemap: false,
});
