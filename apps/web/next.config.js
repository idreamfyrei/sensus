import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for Docker production images.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  output: "standalone",
  // Point at the monorepo root so the standalone tracer pulls in
  // workspace packages too.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
