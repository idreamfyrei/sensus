import { describe, it, expect } from "vitest";

import { operatorMatches, evaluateConditions, type ConditionRow, type Operator } from "./evaluator";

function mkCondition(overrides: Partial<ConditionRow>): ConditionRow {
  const base: ConditionRow = {
    id: overrides.id ?? "cond_test",
    sourceFieldId: overrides.sourceFieldId ?? "field_src",
    operator: overrides.operator ?? "eq",
    value: overrides.value ?? null,
    action: overrides.action ?? "show",
    targetFieldId: overrides.targetFieldId ?? null,
    targetSectionId: overrides.targetSectionId ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
  };
  return { ...base, ...overrides };
}

describe("operatorMatches", () => {
  const cases: Array<{
    op: Operator;
    source: unknown;
    value: string | null;
    expected: boolean;
    note: string;
  }> = [
    { op: "eq", source: "hello", value: "hello", expected: true, note: "string equality" },
    { op: "eq", source: "hello", value: "world", expected: false, note: "string inequality" },
    { op: "eq", source: 42, value: "42", expected: true, note: "number eq via string coerce" },
    { op: "eq", source: true, value: "true", expected: true, note: "boolean eq" },
    { op: "eq", source: ["a", "b"], value: "a", expected: true, note: "array contains a" },
    { op: "eq", source: undefined, value: "", expected: true, note: "undefined eq empty" },
    { op: "neq", source: "hello", value: "world", expected: true, note: "neq satisfied" },
    { op: "neq", source: "hello", value: "hello", expected: false, note: "neq not satisfied" },
    { op: "contains", source: "the quick fox", value: "quick", expected: true, note: "substring" },
    {
      op: "contains",
      source: "The Quick Fox",
      value: "quick",
      expected: true,
      note: "case-insensitive substring",
    },
    {
      op: "contains",
      source: ["red", "green"],
      value: "red",
      expected: true,
      note: "array membership",
    },
    {
      op: "contains",
      source: ["red", "green"],
      value: "blue",
      expected: false,
      note: "array non-membership",
    },
    {
      op: "contains",
      source: null,
      value: "x",
      expected: false,
      note: "null source never contains",
    },
    { op: "gt", source: 5, value: "3", expected: true, note: "gt true" },
    { op: "gt", source: 3, value: "5", expected: false, note: "gt false" },
    { op: "gt", source: "5", value: "3", expected: true, note: "gt with string source" },
    { op: "gt", source: undefined, value: "3", expected: false, note: "gt with undefined" },
    { op: "lt", source: 3, value: "5", expected: true, note: "lt true" },
    { op: "lt", source: 5, value: "3", expected: false, note: "lt false" },
    { op: "empty", source: "", value: null, expected: true, note: "empty string" },
    { op: "empty", source: "  ", value: null, expected: true, note: "whitespace string" },
    { op: "empty", source: [], value: null, expected: true, note: "empty array" },
    { op: "empty", source: null, value: null, expected: true, note: "null" },
    { op: "empty", source: undefined, value: null, expected: true, note: "undefined" },
    { op: "empty", source: false, value: null, expected: true, note: "false bool counts as empty" },
    { op: "empty", source: "x", value: null, expected: false, note: "non-empty string" },
    { op: "not_empty", source: "x", value: null, expected: true, note: "non-empty string" },
    { op: "not_empty", source: 0, value: null, expected: true, note: "zero is not empty" },
    { op: "not_empty", source: "", value: null, expected: false, note: "empty string is empty" },
  ];

  for (const { op, source, value, expected, note } of cases) {
    it(`${op} ${note} → ${expected}`, () => {
      expect(operatorMatches(op, source, value)).toBe(expected);
    });
  }
});

describe("evaluateConditions — show action", () => {
  it("hides target field by default when a show rule exists", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "eq",
          value: "yes",
          action: "show",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "no" },
    });
    expect(result.hiddenFieldIds.has("tgt")).toBe(true);
  });

  it("reveals target when show rule satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "eq",
          value: "yes",
          action: "show",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "yes" },
    });
    expect(result.hiddenFieldIds.has("tgt")).toBe(false);
  });

  it("reveals target if ANY of multiple show rules is satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          id: "r1",
          sourceFieldId: "a",
          operator: "eq",
          value: "1",
          action: "show",
          targetFieldId: "tgt",
        }),
        mkCondition({
          id: "r2",
          sourceFieldId: "b",
          operator: "eq",
          value: "2",
          action: "show",
          targetFieldId: "tgt",
        }),
      ],
      answers: { a: "no", b: "2" },
    });
    expect(result.hiddenFieldIds.has("tgt")).toBe(false);
  });

  it("handles a section target", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "eq",
          value: "yes",
          action: "show",
          targetSectionId: "sec",
        }),
      ],
      answers: { src: "no" },
    });
    expect(result.hiddenSectionIds.has("sec")).toBe(true);
    expect(result.hiddenFieldIds.has("sec")).toBe(false);
  });
});

describe("evaluateConditions — hide action", () => {
  it("hides target field when satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "eq",
          value: "secret",
          action: "hide",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "secret" },
    });
    expect(result.hiddenFieldIds.has("tgt")).toBe(true);
  });

  it("leaves target visible when not satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "eq",
          value: "secret",
          action: "hide",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "other" },
    });
    expect(result.hiddenFieldIds.has("tgt")).toBe(false);
  });
});

describe("evaluateConditions — require action", () => {
  it("marks target required when satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "not_empty",
          action: "require",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "filled" },
    });
    expect(result.requiredFieldIds.has("tgt")).toBe(true);
  });

  it("does not require target when not satisfied", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "src",
          operator: "not_empty",
          action: "require",
          targetFieldId: "tgt",
        }),
      ],
      answers: { src: "" },
    });
    expect(result.requiredFieldIds.has("tgt")).toBe(false);
  });
});

describe("evaluateConditions — jump_to action", () => {
  it("produces a jump target keyed by source field", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "q1",
          operator: "eq",
          value: "skip",
          action: "jump_to",
          targetFieldId: "q5",
        }),
      ],
      answers: { q1: "skip" },
    });
    expect(result.jumpTargets.get("q1")).toEqual({ type: "field", id: "q5" });
  });

  it("uses the earliest-created rule when multiple jumps from same source match", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          id: "second",
          sourceFieldId: "q1",
          operator: "eq",
          value: "skip",
          action: "jump_to",
          targetFieldId: "q5",
          createdAt: new Date("2026-01-02"),
        }),
        mkCondition({
          id: "first",
          sourceFieldId: "q1",
          operator: "eq",
          value: "skip",
          action: "jump_to",
          targetFieldId: "q9",
          createdAt: new Date("2026-01-01"),
        }),
      ],
      answers: { q1: "skip" },
    });
    expect(result.jumpTargets.get("q1")).toEqual({ type: "field", id: "q9" });
  });

  it("supports section jump targets", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "q1",
          operator: "eq",
          value: "skip",
          action: "jump_to",
          targetSectionId: "sec",
        }),
      ],
      answers: { q1: "skip" },
    });
    expect(result.jumpTargets.get("q1")).toEqual({ type: "section", id: "sec" });
  });

  it("produces no jump when no condition satisfies", () => {
    const result = evaluateConditions({
      conditions: [
        mkCondition({
          sourceFieldId: "q1",
          operator: "eq",
          value: "skip",
          action: "jump_to",
          targetFieldId: "q5",
        }),
      ],
      answers: { q1: "no" },
    });
    expect(result.jumpTargets.get("q1")).toBeUndefined();
  });
});
