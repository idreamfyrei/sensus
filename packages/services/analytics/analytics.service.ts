import {
  and,
  eq,
  gte,
  inArray,
  fieldOptionsTable,
  formFieldsTable,
  formViewsTable,
  formsTable,
  responsesTable,
  responseAnswersTable,
  notDeleted,
  type Database,
} from "@repo/database";
import { FormForbiddenError, FormNotFoundError } from "../form/form.service";

export type DailyCount = { date: string; count: number };

export type OptionDistribution = {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  buckets: Array<{ value: string; count: number }>;
};

export type AnalyticsSummary = {
  totalViews: number;
  totalSubmits: number;
  completionRate: number;
  viewsByDay: DailyCount[];
  submitsByDay: DailyCount[];
  optionDistributions: OptionDistribution[];
};

const DAY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fillDays(buckets: Map<string, number>, from: Date, to: Date): DailyCount[] {
  const out: DailyCount[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = isoDay(cursor);
    out.push({ date: key, count: buckets.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export class AnalyticsService {
  constructor(private readonly db: Database) {}

  async summary(args: { formId: string; userId: string }): Promise<AnalyticsSummary> {
    const [form] = await this.db
      .select({ userId: formsTable.userId })
      .from(formsTable)
      .where(and(eq(formsTable.id, args.formId), notDeleted(formsTable.deletedAt)));
    if (!form) throw new FormNotFoundError();
    if (form.userId !== args.userId) throw new FormForbiddenError();

    const now = new Date();
    const since = new Date(now.getTime() - DAY_WINDOW_MS);

    const views = await this.db
      .select({ at: formViewsTable.viewedAt })
      .from(formViewsTable)
      .where(
        and(
          eq(formViewsTable.formId, args.formId),
          notDeleted(formViewsTable.deletedAt),
          gte(formViewsTable.viewedAt, since),
        ),
      );

    const submits = await this.db
      .select({ at: responsesTable.submittedAt })
      .from(responsesTable)
      .where(
        and(
          eq(responsesTable.formId, args.formId),
          notDeleted(responsesTable.deletedAt),
          gte(responsesTable.submittedAt, since),
        ),
      );

    const viewBuckets = new Map<string, number>();
    for (const v of views) {
      const day = isoDay(v.at);
      viewBuckets.set(day, (viewBuckets.get(day) ?? 0) + 1);
    }
    const submitBuckets = new Map<string, number>();
    for (const s of submits) {
      const day = isoDay(s.at);
      submitBuckets.set(day, (submitBuckets.get(day) ?? 0) + 1);
    }

    const viewsByDay = fillDays(viewBuckets, since, now);
    const submitsByDay = fillDays(submitBuckets, since, now);

    const totalViews = views.length;
    const totalSubmits = submits.length;
    const completionRate = totalViews > 0 ? totalSubmits / totalViews : 0;

    const fields = await this.db
      .select()
      .from(formFieldsTable)
      .where(and(eq(formFieldsTable.formId, args.formId), notDeleted(formFieldsTable.deletedAt)));

    const selectableFields = fields.filter(
      (f) =>
        f.type === "single_select" ||
        f.type === "multi_select" ||
        f.type === "dropdown" ||
        f.type === "rating",
    );

    const optionDistributions: OptionDistribution[] = [];
    if (selectableFields.length > 0) {
      const fieldIds = selectableFields.map((f) => f.id);
      const options = await this.db
        .select()
        .from(fieldOptionsTable)
        .where(
          and(
            inArray(fieldOptionsTable.fieldId, fieldIds),
            notDeleted(fieldOptionsTable.deletedAt),
          ),
        );
      const optionsByField = new Map<string, Array<{ value: string; label: string }>>();
      for (const o of options) {
        const list = optionsByField.get(o.fieldId) ?? [];
        list.push({ value: o.value, label: o.label });
        optionsByField.set(o.fieldId, list);
      }

      const answers = await this.db
        .select()
        .from(responseAnswersTable)
        .where(
          and(
            inArray(responseAnswersTable.formFieldId, fieldIds),
            notDeleted(responseAnswersTable.deletedAt),
          ),
        );

      for (const f of selectableFields) {
        const buckets = new Map<string, number>();
        for (const a of answers) {
          if (a.formFieldId !== f.id) continue;
          if (Array.isArray(a.valueJson)) {
            for (const v of a.valueJson) {
              const k = String(v);
              buckets.set(k, (buckets.get(k) ?? 0) + 1);
            }
          } else if (a.valueText !== null) {
            buckets.set(a.valueText, (buckets.get(a.valueText) ?? 0) + 1);
          }
        }
        const known = optionsByField.get(f.id) ?? [];
        const seen = new Set<string>();
        const ordered = known.map((o) => {
          seen.add(o.value);
          return { value: o.label || o.value, count: buckets.get(o.value) ?? 0 };
        });
        for (const [value, count] of buckets) {
          if (!seen.has(value)) ordered.push({ value, count });
        }
        optionDistributions.push({
          fieldId: f.id,
          fieldLabel: f.label,
          fieldType: f.type,
          buckets: ordered,
        });
      }
    }

    return {
      totalViews,
      totalSubmits,
      completionRate,
      viewsByDay,
      submitsByDay,
      optionDistributions,
    };
  }
}
