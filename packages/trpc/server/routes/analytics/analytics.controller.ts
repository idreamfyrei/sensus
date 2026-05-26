import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export type SummaryInput = { formId: string };

export class AnalyticsController {
  async summary(ctx: ProtectedContext, input: SummaryInput) {
    return ctx.services.analytics.summary({
      formId: input.formId,
      userId: ctx.userId,
    });
  }
}
