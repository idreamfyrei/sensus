import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Sensus OpenAPI",
  version: "0.0.1",
  baseUrl: env.BASE_URL.concat("/api"),
});

/**
 * CORS — must echo a specific origin (not `*`) because the tRPC client sends
 * `credentials: "include"` (cookies needed for Better Auth in Phase 3).
 * Browsers reject `Access-Control-Allow-Origin: *` when credentials are in play.
 *
 * In dev we trust the local web app; in prod, list explicit allowed origins.
 */
const isProd = env.NODE_ENV === "prod" || env.NODE_ENV === "production";
const allowedOrigins = isProd
  ? (process.env.WEB_ORIGIN?.split(",") ?? [])
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "Sensus is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Sensus server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

logger.info(`Scalar docs at ${env.BASE_URL}/docs`);

export default app;
