import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { AnalyticsController } from "./analytics.controller";

const summaryInput = z.object({ formId: z.string().uuid() });

const controller = new AnalyticsController();

export const analyticsRouter = router({
  summary: protectedProcedure
    .input(summaryInput)
    .query(({ ctx, input }) => controller.summary(ctx, input)),
});
