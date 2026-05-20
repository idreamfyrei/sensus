import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { HealthController, healthOutput } from "./health.controller";

const controller = new HealthController();

export const healthRouter = router({
  getHealth: publicProcedure
    .meta({ openapi: { method: "GET", path: "/health", tags: ["Health"] } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        status: z.literal("healthy").describe("status of the server"),
      }),
    )
    .query(async () => {
      return {
        status: "healthy",
      };
    }),
});
