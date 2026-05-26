import type { FieldType } from "@repo/schemas";
import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export type AddFieldInput = {
  formId: string;
  sectionId: string;
  type: FieldType;
  label: string;
};

export type UpdateFieldInput = {
  fieldId: string;
  patch: {
    label?: string;
    description?: string | null;
    placeholder?: string | null;
    required?: boolean;
    minLength?: number | null;
    maxLength?: number | null;
    min?: number | null;
    max?: number | null;
    pattern?: string | null;
    isInteger?: boolean | null;
    includeTime?: boolean | null;
    maxRating?: number | null;
    minSelected?: number | null;
    maxSelected?: number | null;
  };
};

export type DeleteFieldInput = { fieldId: string };

export type ReorderFieldsInput = { formId: string; orderedIds: string[] };

export type SetOptionsInput = {
  fieldId: string;
  options: Array<{ label: string; value: string }>;
};

export class FieldsController {
  async add(ctx: ProtectedContext, input: AddFieldInput) {
    return ctx.services.fields.addField({
      formId: input.formId,
      userId: ctx.userId,
      sectionId: input.sectionId,
      type: input.type,
      label: input.label,
    });
  }

  async update(ctx: ProtectedContext, input: UpdateFieldInput) {
    return ctx.services.fields.updateField({
      fieldId: input.fieldId,
      userId: ctx.userId,
      patch: input.patch,
    });
  }

  async delete(ctx: ProtectedContext, input: DeleteFieldInput): Promise<{ ok: true }> {
    await ctx.services.fields.deleteField({ fieldId: input.fieldId, userId: ctx.userId });
    return { ok: true };
  }

  async reorder(ctx: ProtectedContext, input: ReorderFieldsInput): Promise<{ ok: true }> {
    await ctx.services.fields.reorderFields({
      formId: input.formId,
      userId: ctx.userId,
      orderedIds: input.orderedIds,
    });
    return { ok: true };
  }

  async setOptions(ctx: ProtectedContext, input: SetOptionsInput) {
    return ctx.services.fields.setOptions({
      fieldId: input.fieldId,
      userId: ctx.userId,
      options: input.options,
    });
  }
}
