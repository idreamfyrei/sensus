import { describe, it, expect } from "vitest";
import { FIELD_TYPES, FIELD_TYPES_CATALOG, type FieldRow } from "./index";

function mkField(type: FieldRow["type"], over: Partial<FieldRow> = {}): FieldRow {
  return {
    id: "f1",
    formId: "form1",
    sectionId: "sec1",
    type,
    label: "Q",
    description: null,
    placeholder: null,
    order: 0,
    required: false,
    minLength: null,
    maxLength: null,
    min: null,
    max: null,
    pattern: null,
    isInteger: null,
    includeTime: null,
    maxRating: null,
    minSelected: null,
    maxSelected: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  };
}

describe("FIELD_TYPES_CATALOG", () => {
  it("has an entry for every type in the FIELD_TYPES enum", () => {
    for (const t of FIELD_TYPES) {
      expect(FIELD_TYPES_CATALOG[t]).toBeDefined();
      expect(FIELD_TYPES_CATALOG[t].type).toBe(t);
    }
  });

  it("flags select-style types as hasOptions", () => {
    expect(FIELD_TYPES_CATALOG.single_select.hasOptions).toBe(true);
    expect(FIELD_TYPES_CATALOG.multi_select.hasOptions).toBe(true);
    expect(FIELD_TYPES_CATALOG.dropdown.hasOptions).toBe(true);
    expect(FIELD_TYPES_CATALOG.short_text.hasOptions).toBe(false);
  });

  it("routes multi_select answers to valueJson, all others to valueText", () => {
    for (const t of FIELD_TYPES) {
      const expected = t === "multi_select" ? "json" : "text";
      expect(FIELD_TYPES_CATALOG[t].answerKind).toBe(expected);
    }
  });
});

describe("short_text", () => {
  const def = FIELD_TYPES_CATALOG.short_text;

  it("optional accepts undefined and any string", () => {
    const s = def.buildAnswerSchema(mkField("short_text"));
    expect(s.safeParse("hello").success).toBe(true);
    expect(s.safeParse(undefined).success).toBe(true);
  });

  it("required + maxLength + minLength", () => {
    const s = def.buildAnswerSchema(
      mkField("short_text", { required: true, minLength: 2, maxLength: 5 }),
    );
    expect(s.safeParse("hi").success).toBe(true);
    expect(s.safeParse("a").success).toBe(false);
    expect(s.safeParse("toolong").success).toBe(false);
    expect(s.safeParse("").success).toBe(false);
  });

  it("required rejects empty string", () => {
    const s = def.buildAnswerSchema(mkField("short_text", { required: true }));
    expect(s.safeParse("").success).toBe(false);
    expect(s.safeParse("x").success).toBe(true);
  });
});

describe("email", () => {
  it("validates format when required", () => {
    const s = FIELD_TYPES_CATALOG.email.buildAnswerSchema(mkField("email", { required: true }));
    expect(s.safeParse("ok@example.com").success).toBe(true);
    expect(s.safeParse("nope").success).toBe(false);
  });
});

describe("number", () => {
  it("respects isInteger and bounds", () => {
    const s = FIELD_TYPES_CATALOG.number.buildAnswerSchema(
      mkField("number", { required: true, isInteger: true, min: 1, max: 10 }),
    );
    expect(s.safeParse(5).success).toBe(true);
    expect(s.safeParse(5.5).success).toBe(false);
    expect(s.safeParse(11).success).toBe(false);
  });
});

describe("single_select", () => {
  it("required accepts only listed option values", () => {
    const s = FIELD_TYPES_CATALOG.single_select.buildAnswerSchema(
      mkField("single_select", { required: true }),
      ["a", "b"],
    );
    expect(s.safeParse("a").success).toBe(true);
    expect(s.safeParse("c").success).toBe(false);
  });
});

describe("multi_select", () => {
  it("respects minSelected/maxSelected and option whitelist", () => {
    const s = FIELD_TYPES_CATALOG.multi_select.buildAnswerSchema(
      mkField("multi_select", { required: true, minSelected: 2, maxSelected: 3 }),
      ["a", "b", "c", "d"],
    );
    expect(s.safeParse(["a"]).success).toBe(false);
    expect(s.safeParse(["a", "b"]).success).toBe(true);
    expect(s.safeParse(["a", "b", "c", "d"]).success).toBe(false);
    expect(s.safeParse(["a", "x"]).success).toBe(false);
  });
});

describe("checkbox", () => {
  it("required must be true", () => {
    const s = FIELD_TYPES_CATALOG.checkbox.buildAnswerSchema(
      mkField("checkbox", { required: true }),
    );
    expect(s.safeParse(true).success).toBe(true);
    expect(s.safeParse(false).success).toBe(false);
  });

  it("optional accepts either", () => {
    const s = FIELD_TYPES_CATALOG.checkbox.buildAnswerSchema(mkField("checkbox"));
    expect(s.safeParse(true).success).toBe(true);
    expect(s.safeParse(false).success).toBe(true);
  });
});

describe("rating", () => {
  it("respects maxRating bounds", () => {
    const s = FIELD_TYPES_CATALOG.rating.buildAnswerSchema(
      mkField("rating", { required: true, maxRating: 5 }),
    );
    expect(s.safeParse(5).success).toBe(true);
    expect(s.safeParse(6).success).toBe(false);
    expect(s.safeParse(0).success).toBe(false);
  });
});

describe("date", () => {
  const dateOnly = FIELD_TYPES_CATALOG.date.buildAnswerSchema(mkField("date", { required: true }));
  const withTime = FIELD_TYPES_CATALOG.date.buildAnswerSchema(
    mkField("date", { required: true, includeTime: true }),
  );

  it("date-only mode", () => {
    expect(dateOnly.safeParse("2026-01-15").success).toBe(true);
    expect(dateOnly.safeParse("2026-01-15T10:00").success).toBe(false);
  });

  it("date-time mode", () => {
    expect(withTime.safeParse("2026-01-15T10:00").success).toBe(true);
    expect(withTime.safeParse("2026-01-15T10:00:30Z").success).toBe(true);
    expect(withTime.safeParse("2026-01-15").success).toBe(false);
  });
});
