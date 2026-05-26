import { z } from "zod";
import { FIELD_TYPES } from "@repo/schemas";
import { protectedProcedure, router } from "../../trpc";
import { FieldsController } from "./fields.controller";

const fieldTypeEnum = z.enum(FIELD_TYPES);

const addFieldInput = z.object({
  formId: z.string().uuid(),
  sectionId: z.string().uuid(),
  type: fieldTypeEnum,
  label: z.string().min(1).max(200),
});

const updateFieldInput = z.object({
  fieldId: z.string().uuid(),
  patch: z
    .object({
      label: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      placeholder: z.string().max(200).nullable().optional(),
      required: z.boolean().optional(),
      minLength: z.number().int().min(0).nullable().optional(),
      maxLength: z.number().int().min(0).nullable().optional(),
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      pattern: z.string().max(500).nullable().optional(),
      isInteger: z.boolean().nullable().optional(),
      includeTime: z.boolean().nullable().optional(),
      maxRating: z.number().int().min(1).max(20).nullable().optional(),
      minSelected: z.number().int().min(0).nullable().optional(),
      maxSelected: z.number().int().min(0).nullable().optional(),
    })
    .strict(),
});

const deleteFieldInput = z.object({
  fieldId: z.string().uuid(),
});

const reorderAllFieldsInput = z.object({
  formId: z.string().uuid(),
  sections: z.array(
    z.object({
      sectionId: z.string().uuid(),
      fieldIds: z.array(z.string().uuid()),
    }),
  ),
});

const setOptionsInput = z.object({
  fieldId: z.string().uuid(),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        value: z.string().min(1).max(200),
      }),
    )
    .max(200),
});

const controller = new FieldsController();

export const fieldsRouter = router({
  add: protectedProcedure
    .input(addFieldInput)
    .mutation(({ ctx, input }) => controller.add(ctx, input)),

  update: protectedProcedure
    .input(updateFieldInput)
    .mutation(({ ctx, input }) => controller.update(ctx, input)),

  delete: protectedProcedure
    .input(deleteFieldInput)
    .mutation(({ ctx, input }) => controller.delete(ctx, input)),

  reorderAll: protectedProcedure
    .input(reorderAllFieldsInput)
    .mutation(({ ctx, input }) => controller.reorderAll(ctx, input)),

  setOptions: protectedProcedure
    .input(setOptionsInput)
    .mutation(({ ctx, input }) => controller.setOptions(ctx, input)),
});
