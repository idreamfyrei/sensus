import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

type Operator = "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "not_empty";
type Action = "show" | "hide" | "require" | "jump_to";

export type AddConditionInput = {
  formId: string;
  sourceFieldId: string;
  operator: Operator;
  value: string | null;
  action: Action;
  targetFieldId: string | null;
  targetSectionId: string | null;
};

export type UpdateConditionInput = {
  conditionId: string;
  patch: {
    operator?: Operator;
    value?: string | null;
    action?: Action;
    targetFieldId?: string | null;
    targetSectionId?: string | null;
  };
};

export type DeleteConditionInput = { conditionId: string };

export class ConditionsController {
  async add(ctx: ProtectedContext, input: AddConditionInput) {
    return ctx.services.conditions.addCondition({
      formId: input.formId,
      userId: ctx.userId,
      sourceFieldId: input.sourceFieldId,
      operator: input.operator,
      value: input.value,
      action: input.action,
      targetFieldId: input.targetFieldId,
      targetSectionId: input.targetSectionId,
    });
  }

  async update(ctx: ProtectedContext, input: UpdateConditionInput) {
    return ctx.services.conditions.updateCondition({
      conditionId: input.conditionId,
      userId: ctx.userId,
      patch: input.patch,
    });
  }

  async delete(ctx: ProtectedContext, input: DeleteConditionInput): Promise<{ ok: true }> {
    await ctx.services.conditions.deleteCondition({
      conditionId: input.conditionId,
      userId: ctx.userId,
    });
    return { ok: true };
  }
}
