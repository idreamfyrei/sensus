import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { ResponsesController } from "./responses.controller";

const listInput = z.object({
  formId: z.string().uuid(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).optional(),
});

const getInput = z.object({ responseId: z.string().uuid() });
const exportInput = z.object({ formId: z.string().uuid() });

const controller = new ResponsesController();

export const responsesRouter = router({
  list: protectedProcedure.input(listInput).query(({ ctx, input }) => controller.list(ctx, input)),
  get: protectedProcedure.input(getInput).query(({ ctx, input }) => controller.get(ctx, input)),
  exportCsv: protectedProcedure
    .input(exportInput)
    .query(({ ctx, input }) => controller.exportCsv(ctx, input)),
});
