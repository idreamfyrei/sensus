import { describe, it, expect } from "vitest";
import { createFormInput, setFormSlugInput } from "./form";
import { createFieldConditionInput } from "./field-condition";
import { createResponseAnswerInput } from "./response-answer";

// Zod 4 / drizzle-zod's uuid() validator is strict (v1–v8). Position 13 must
// be the version (1–8) and position 17 must be the variant (8/9/a/b). These
// fixtures are v4-shaped.
const SAMPLE_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_UUID = "22222222-2222-4222-8222-222222222222";
const THIRD_UUID = "33333333-3333-4333-8333-333333333333";

describe("createFormInput", () => {
  const validBase = {
    title: "My Form",
    themeId: SAMPLE_UUID,
    visibility: "public" as const,
    layout: "one_per_screen" as const,
  };

  it("accepts a minimal valid payload", () => {
    expect(createFormInput.safeParse(validBase).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(createFormInput.safeParse({ ...validBase, title: "" }).success).toBe(false);
  });

  it("rejects a title over 200 chars", () => {
    expect(createFormInput.safeParse({ ...validBase, title: "x".repeat(201) }).success).toBe(false);
  });
});

describe("setFormSlugInput", () => {
  const base = { id: SAMPLE_UUID, version: 1 };

  it("accepts lowercase-hyphenated slugs", () => {
    expect(setFormSlugInput.safeParse({ ...base, slug: "my-form-123" }).success).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(setFormSlugInput.safeParse({ ...base, slug: "My-Form" }).success).toBe(false);
  });

  it("rejects spaces", () => {
    expect(setFormSlugInput.safeParse({ ...base, slug: "my form" }).success).toBe(false);
  });
});

describe("createFieldConditionInput — target XOR refine", () => {
  const base = {
    formId: SAMPLE_UUID,
    sourceFieldId: OTHER_UUID,
    operator: "eq" as const,
    value: "yes",
    action: "show" as const,
  };

  it("accepts a target on field only", () => {
    expect(
      createFieldConditionInput.safeParse({
        ...base,
        targetFieldId: SAMPLE_UUID,
        targetSectionId: null,
      }).success,
    ).toBe(true);
  });

  it("accepts a target on section only", () => {
    expect(
      createFieldConditionInput.safeParse({
        ...base,
        targetFieldId: null,
        targetSectionId: SAMPLE_UUID,
      }).success,
    ).toBe(true);
  });

  it("rejects both targets set", () => {
    expect(
      createFieldConditionInput.safeParse({
        ...base,
        targetFieldId: SAMPLE_UUID,
        targetSectionId: THIRD_UUID,
      }).success,
    ).toBe(false);
  });

  it("rejects neither target set", () => {
    expect(
      createFieldConditionInput.safeParse({
        ...base,
        targetFieldId: null,
        targetSectionId: null,
      }).success,
    ).toBe(false);
  });
});

describe("createResponseAnswerInput — value XOR refine", () => {
  const base = {
    responseId: SAMPLE_UUID,
    formFieldId: OTHER_UUID,
  };

  it("accepts valueText only", () => {
    expect(
      createResponseAnswerInput.safeParse({
        ...base,
        valueText: "hello",
        valueJson: null,
      }).success,
    ).toBe(true);
  });

  it("accepts valueJson only", () => {
    expect(
      createResponseAnswerInput.safeParse({
        ...base,
        valueText: null,
        valueJson: { selected: ["a", "b"] },
      }).success,
    ).toBe(true);
  });

  it("rejects both set", () => {
    expect(
      createResponseAnswerInput.safeParse({
        ...base,
        valueText: "x",
        valueJson: ["y"],
      }).success,
    ).toBe(false);
  });

  it("rejects neither set", () => {
    expect(
      createResponseAnswerInput.safeParse({
        ...base,
        valueText: null,
        valueJson: null,
      }).success,
    ).toBe(false);
  });
});
