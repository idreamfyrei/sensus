import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { ConditionsController } from "./conditions.controller";

const operatorEnum = z.enum(["eq", "neq", "contains", "gt", "lt", "empty", "not_empty"]);
const actionEnum = z.enum(["show", "hide", "require", "jump_to"]);

const addInput = z.object({
  formId: z.string().uuid(),
  sourceFieldId: z.string().uuid(),
  operator: operatorEnum,
  value: z.string().max(500).nullable(),
  action: actionEnum,
  targetFieldId: z.string().uuid().nullable(),
  targetSectionId: z.string().uuid().nullable(),
});

const updateInput = z.object({
  conditionId: z.string().uuid(),
  patch: z
    .object({
      operator: operatorEnum.optional(),
      value: z.string().max(500).nullable().optional(),
      action: actionEnum.optional(),
      targetFieldId: z.string().uuid().nullable().optional(),
      targetSectionId: z.string().uuid().nullable().optional(),
    })
    .strict(),
});

const deleteInput = z.object({ conditionId: z.string().uuid() });

const controller = new ConditionsController();

export const conditionsRouter = router({
  add: protectedProcedure.input(addInput).mutation(({ ctx, input }) => controller.add(ctx, input)),
  update: protectedProcedure
    .input(updateInput)
    .mutation(({ ctx, input }) => controller.update(ctx, input)),
  delete: protectedProcedure
    .input(deleteInput)
    .mutation(({ ctx, input }) => controller.delete(ctx, input)),
});
