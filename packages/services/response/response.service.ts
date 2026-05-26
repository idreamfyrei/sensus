import {
  and,
  eq,
  inArray,
  desc,
  sql,
  formFieldsTable,
  formsTable,
  responsesTable,
  responseAnswersTable,
  notDeleted,
  type Database,
} from "@repo/database";
import { FormForbiddenError, FormNotFoundError } from "../form/form.service";

type Response = typeof responsesTable.$inferSelect;
type ResponseAnswer = typeof responseAnswersTable.$inferSelect;

export type ResponseWithAnswers = Response & { answers: ResponseAnswer[] };

export class ResponseNotFoundError extends Error {
  readonly code = "RESPONSE_NOT_FOUND" as const;
  constructor() {
    super("Response not found");
    this.name = "ResponseNotFoundError";
  }
}

export class ResponseService {
  constructor(private readonly db: Database) {}

  private async assertFormOwner(args: { formId: string; userId: string }): Promise<void> {
    const [form] = await this.db
      .select({ userId: formsTable.userId })
      .from(formsTable)
      .where(and(eq(formsTable.id, args.formId), notDeleted(formsTable.deletedAt)));
    if (!form) throw new FormNotFoundError();
    if (form.userId !== args.userId) throw new FormForbiddenError();
  }

  async listByForm(args: {
    formId: string;
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<{ responses: ResponseWithAnswers[]; total: number }> {
    await this.assertFormOwner({ formId: args.formId, userId: args.userId });

    const allResponses = await this.db
      .select()
      .from(responsesTable)
      .where(and(eq(responsesTable.formId, args.formId), notDeleted(responsesTable.deletedAt)))
      .orderBy(desc(responsesTable.submittedAt))
      .limit(args.limit ?? 100)
      .offset(args.offset ?? 0);

    const ids = allResponses.map((r) => r.id);
    const answers =
      ids.length === 0
        ? []
        : await this.db
            .select()
            .from(responseAnswersTable)
            .where(
              and(
                inArray(responseAnswersTable.responseId, ids),
                notDeleted(responseAnswersTable.deletedAt),
              ),
            );

    const answersByResponse = new Map<string, ResponseAnswer[]>();
    for (const a of answers) {
      const list = answersByResponse.get(a.responseId) ?? [];
      list.push(a);
      answersByResponse.set(a.responseId, list);
    }

    const enriched: ResponseWithAnswers[] = allResponses.map((r) => ({
      ...r,
      answers: answersByResponse.get(r.id) ?? [],
    }));

    const [countRow] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(responsesTable)
      .where(and(eq(responsesTable.formId, args.formId), notDeleted(responsesTable.deletedAt)));

    return { responses: enriched, total: countRow?.total ?? enriched.length };
  }

  async getById(args: { responseId: string; userId: string }): Promise<ResponseWithAnswers> {
    const [row] = await this.db
      .select()
      .from(responsesTable)
      .where(and(eq(responsesTable.id, args.responseId), notDeleted(responsesTable.deletedAt)));
    if (!row) throw new ResponseNotFoundError();
    await this.assertFormOwner({ formId: row.formId, userId: args.userId });

    const answers = await this.db
      .select()
      .from(responseAnswersTable)
      .where(
        and(
          eq(responseAnswersTable.responseId, row.id),
          notDeleted(responseAnswersTable.deletedAt),
        ),
      );

    return { ...row, answers };
  }

  /**
   * Export all responses for a form as CSV text. Columns: submittedAt + one
   * per live form field. Multi-value answers are semicolon-joined. Quoted with
   * CSV escaping.
   */
  async exportCsv(args: { formId: string; userId: string }): Promise<string> {
    await this.assertFormOwner({ formId: args.formId, userId: args.userId });

    const fields = await this.db
      .select()
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.formId, args.formId), notDeleted(formFieldsTable.deletedAt)))
      .orderBy(formFieldsTable.order);

    const { responses } = await this.listByForm({
      formId: args.formId,
      userId: args.userId,
      limit: 100000,
    });

    const headers = ["submitted_at", ...fields.map((f) => f.label || f.id)];
    const lines: string[] = [headers.map(csvEscape).join(",")];

    for (const r of responses) {
      const byField = new Map<string, ResponseAnswer>();
      for (const a of r.answers) byField.set(a.formFieldId, a);
      const row = [r.submittedAt.toISOString()];
      for (const f of fields) {
        const ans = byField.get(f.id);
        if (!ans) {
          row.push("");
          continue;
        }
        if (ans.valueText !== null) {
          row.push(ans.valueText);
        } else if (Array.isArray(ans.valueJson)) {
          row.push(ans.valueJson.map((v) => String(v)).join("; "));
        } else if (ans.valueJson !== null && ans.valueJson !== undefined) {
          row.push(JSON.stringify(ans.valueJson));
        } else {
          row.push("");
        }
      }
      lines.push(row.map(csvEscape).join(","));
    }

    return lines.join("\n");
  }
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
