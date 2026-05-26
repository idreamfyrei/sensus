import type { Context } from "../../context";

type ProtectedContext = Context & { userId: string };

export type ListResponsesInput = { formId: string; limit?: number; offset?: number };
export type GetResponseInput = { responseId: string };
export type ExportCsvInput = { formId: string };

export class ResponsesController {
  async list(ctx: ProtectedContext, input: ListResponsesInput) {
    return ctx.services.responses.listByForm({
      formId: input.formId,
      userId: ctx.userId,
      limit: input.limit,
      offset: input.offset,
    });
  }

  async get(ctx: ProtectedContext, input: GetResponseInput) {
    return ctx.services.responses.getById({
      responseId: input.responseId,
      userId: ctx.userId,
    });
  }

  async exportCsv(ctx: ProtectedContext, input: ExportCsvInput): Promise<{ csv: string }> {
    const csv = await ctx.services.responses.exportCsv({
      formId: input.formId,
      userId: ctx.userId,
    });
    return { csv };
  }
}
