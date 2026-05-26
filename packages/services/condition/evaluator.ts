export type Operator = "eq" | "neq" | "contains" | "gt" | "lt" | "empty" | "not_empty";

export type Action = "show" | "hide" | "require" | "jump_to";

/**
 * Structural shape the evaluator needs. Compatible with both the DB row
 * (createdAt: Date) and the tRPC wire shape (createdAt: string).
 */
export type ConditionRow = {
  id: string;
  sourceFieldId: string;
  operator: Operator;
  value: string | null;
  action: Action;
  targetFieldId: string | null;
  targetSectionId: string | null;
  createdAt: Date | string;
};

export type JumpTarget = { type: "field"; id: string } | { type: "section"; id: string };

export type ConditionEvaluation = {
  hiddenFieldIds: ReadonlySet<string>;
  hiddenSectionIds: ReadonlySet<string>;
  requiredFieldIds: ReadonlySet<string>;
  /** sourceFieldId → first matching jump target (deterministic by condition.createdAt) */
  jumpTargets: ReadonlyMap<string, JumpTarget>;
};

export type EvaluateInput = {
  conditions: ReadonlyArray<ConditionRow>;
  answers: Readonly<Record<string, unknown>>;
};

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "boolean" && v === false) return true;
  return false;
}

function compareEqual(source: unknown, expected: string | null): boolean {
  const target = expected ?? "";
  if (Array.isArray(source)) return source.some((v) => String(v) === target);
  if (typeof source === "boolean") return String(source) === target;
  if (source === undefined || source === null) return target === "";
  return String(source) === target;
}

function compareContains(source: unknown, expected: string | null): boolean {
  const needle = expected ?? "";
  if (Array.isArray(source)) return source.some((v) => String(v) === needle);
  if (source === undefined || source === null) return false;
  return String(source).toLowerCase().includes(needle.toLowerCase());
}

function compareNumeric(source: unknown, expected: string | null): { lt: boolean; gt: boolean } {
  if (expected === null || expected === undefined || expected === "") {
    return { lt: false, gt: false };
  }
  const target = Number(expected);
  if (Number.isNaN(target)) return { lt: false, gt: false };
  const src =
    typeof source === "number"
      ? source
      : source === undefined || source === null || source === ""
        ? NaN
        : Number(source);
  if (Number.isNaN(src)) return { lt: false, gt: false };
  return { lt: src < target, gt: src > target };
}

export function operatorMatches(
  operator: Operator,
  sourceValue: unknown,
  conditionValue: string | null,
): boolean {
  switch (operator) {
    case "empty":
      return isEmptyValue(sourceValue);
    case "not_empty":
      return !isEmptyValue(sourceValue);
    case "eq":
      return compareEqual(sourceValue, conditionValue);
    case "neq":
      return !compareEqual(sourceValue, conditionValue);
    case "contains":
      return compareContains(sourceValue, conditionValue);
    case "gt":
      return compareNumeric(sourceValue, conditionValue).gt;
    case "lt":
      return compareNumeric(sourceValue, conditionValue).lt;
  }
}

export function evaluateConditions(input: EvaluateInput): ConditionEvaluation {
  const { conditions, answers } = input;

  const showRulesByTarget = new Map<string, ConditionRow[]>();
  const hideRulesByTarget = new Map<string, ConditionRow[]>();
  const requireRulesByTarget = new Map<string, ConditionRow[]>();
  const jumpRulesBySource = new Map<string, ConditionRow[]>();

  const targetKey = (c: ConditionRow): string => c.targetFieldId ?? c.targetSectionId ?? "";

  for (const c of conditions) {
    const tKey = targetKey(c);
    if (!tKey && c.action !== "jump_to") continue;
    if (c.action === "show") {
      const list = showRulesByTarget.get(tKey) ?? [];
      list.push(c);
      showRulesByTarget.set(tKey, list);
    } else if (c.action === "hide") {
      const list = hideRulesByTarget.get(tKey) ?? [];
      list.push(c);
      hideRulesByTarget.set(tKey, list);
    } else if (c.action === "require") {
      const list = requireRulesByTarget.get(tKey) ?? [];
      list.push(c);
      requireRulesByTarget.set(tKey, list);
    } else if (c.action === "jump_to") {
      const list = jumpRulesBySource.get(c.sourceFieldId) ?? [];
      list.push(c);
      jumpRulesBySource.set(c.sourceFieldId, list);
    }
  }

  const ruleMatches = (c: ConditionRow): boolean =>
    operatorMatches(c.operator, answers[c.sourceFieldId], c.value);

  const hiddenFieldIds = new Set<string>();
  const hiddenSectionIds = new Set<string>();
  const requiredFieldIds = new Set<string>();
  const jumpTargets = new Map<string, JumpTarget>();

  const isSectionTarget = (c: ConditionRow): boolean => c.targetSectionId !== null;

  for (const [tKey, rules] of showRulesByTarget) {
    const anySatisfied = rules.some(ruleMatches);
    if (!anySatisfied) {
      if (rules[0] && isSectionTarget(rules[0])) hiddenSectionIds.add(tKey);
      else hiddenFieldIds.add(tKey);
    }
  }

  for (const [tKey, rules] of hideRulesByTarget) {
    const anySatisfied = rules.some(ruleMatches);
    if (anySatisfied) {
      if (rules[0] && isSectionTarget(rules[0])) hiddenSectionIds.add(tKey);
      else hiddenFieldIds.add(tKey);
    }
  }

  for (const [tKey, rules] of requireRulesByTarget) {
    if (rules.some(ruleMatches)) requiredFieldIds.add(tKey);
  }

  for (const [sourceFieldId, rules] of jumpRulesBySource) {
    const sorted = [...rules].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const rule of sorted) {
      if (!ruleMatches(rule)) continue;
      if (rule.targetFieldId) {
        jumpTargets.set(sourceFieldId, { type: "field", id: rule.targetFieldId });
        break;
      }
      if (rule.targetSectionId) {
        jumpTargets.set(sourceFieldId, { type: "section", id: rule.targetSectionId });
        break;
      }
    }
  }

  return { hiddenFieldIds, hiddenSectionIds, requiredFieldIds, jumpTargets };
}
