import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  eq,
  themesTable,
  user as userTable,
  formFieldsTable,
  formSectionsTable,
  fieldConditionsTable,
  type Pool,
} from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";

import { FormService } from "../form/form.service";
import { FormSchemaLockedError, FormForbiddenError } from "../form/form.service";
import {
  ConditionService,
  ConditionNotFoundError,
  ConditionInvalidTargetError,
} from "./condition.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let formSvc: FormService;
let conditionSvc: ConditionService;

const USER_A = { id: "user_cond_a", name: "A", email: "a@example.com", emailVerified: false };
const USER_B = { id: "user_cond_b", name: "B", email: "b@example.com", emailVerified: false };
let themeId: string;

beforeAll(async () => {
  const h = createTestDb();
  db = h.db;
  pool = h.pool;
  await setupTestDb(db);
  formSvc = new FormService(db);
  conditionSvc = new ConditionService(db);
});

beforeEach(async () => {
  await cleanTestDb(db);
  await db.insert(userTable).values([USER_A, USER_B]);
  const [theme] = await db
    .insert(themesTable)
    .values({
      key: "default",
      name: "Default",
      bg: "#fff",
      surface: "#fff",
      primary: "#000",
      accent: "#000",
      textColor: "#000",
      muted: "#888",
      borderStyle: "solid",
      borderRadius: "0.5rem",
      fontHeading: "sans-serif",
      fontBody: "sans-serif",
    })
    .returning();
  if (!theme) throw new Error("theme seed failed");
  themeId = theme.id;
});

afterAll(async () => {
  await pool.end();
});

async function setupForm(userId: string) {
  const form = await formSvc.create({ userId, input: { title: "F", themeId } });
  const [section] = await db
    .select()
    .from(formSectionsTable)
    .where(eq(formSectionsTable.formId, form.id));
  if (!section) throw new Error("default section missing");
  const [src] = await db
    .insert(formFieldsTable)
    .values({
      formId: form.id,
      sectionId: section.id,
      type: "short_text",
      label: "src",
      order: 0,
    })
    .returning();
  const [tgt] = await db
    .insert(formFieldsTable)
    .values({
      formId: form.id,
      sectionId: section.id,
      type: "short_text",
      label: "tgt",
      order: 1,
    })
    .returning();
  if (!src || !tgt) throw new Error("field seed failed");
  return { form, section, src, tgt };
}

describe("ConditionService.addCondition", () => {
  it("creates a show condition targeting a field", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });
    expect(cond.action).toBe("show");
    expect(cond.targetFieldId).toBe(tgt.id);
    expect(cond.targetSectionId).toBeNull();
  });

  it("creates a hide condition targeting a section", async () => {
    const { form, section, src } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "x",
      action: "hide",
      targetFieldId: null,
      targetSectionId: section.id,
    });
    expect(cond.targetSectionId).toBe(section.id);
  });

  it("rejects when both targets set", async () => {
    const { form, section, src, tgt } = await setupForm(USER_A.id);
    await expect(
      conditionSvc.addCondition({
        formId: form.id,
        userId: USER_A.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: tgt.id,
        targetSectionId: section.id,
      }),
    ).rejects.toThrow(ConditionInvalidTargetError);
  });

  it("rejects when neither target set", async () => {
    const { form, src } = await setupForm(USER_A.id);
    await expect(
      conditionSvc.addCondition({
        formId: form.id,
        userId: USER_A.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: null,
        targetSectionId: null,
      }),
    ).rejects.toThrow(ConditionInvalidTargetError);
  });

  it("rejects when source field belongs to a different form", async () => {
    const { form: formA } = await setupForm(USER_A.id);
    const { tgt: otherFieldFromA } = await setupForm(USER_A.id);
    void otherFieldFromA;
    const { src: srcFromB } = await setupForm(USER_B.id);
    await expect(
      conditionSvc.addCondition({
        formId: formA.id,
        userId: USER_A.id,
        sourceFieldId: srcFromB.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: otherFieldFromA.id,
        targetSectionId: null,
      }),
    ).rejects.toThrow(ConditionInvalidTargetError);
  });

  it("rejects when target field belongs to a different form", async () => {
    const { form: formA, src } = await setupForm(USER_A.id);
    const { tgt: foreignField } = await setupForm(USER_A.id);
    await expect(
      conditionSvc.addCondition({
        formId: formA.id,
        userId: USER_A.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: foreignField.id,
        targetSectionId: null,
      }),
    ).rejects.toThrow(ConditionInvalidTargetError);
  });

  it("rejects on a published form (schema lock)", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    await formSvc.publish({ id: form.id, userId: USER_A.id, version: form.version });
    await expect(
      conditionSvc.addCondition({
        formId: form.id,
        userId: USER_A.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: tgt.id,
        targetSectionId: null,
      }),
    ).rejects.toThrow(FormSchemaLockedError);
  });

  it("rejects when caller is not the form owner", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    await expect(
      conditionSvc.addCondition({
        formId: form.id,
        userId: USER_B.id,
        sourceFieldId: src.id,
        operator: "eq",
        value: "x",
        action: "show",
        targetFieldId: tgt.id,
        targetSectionId: null,
      }),
    ).rejects.toThrow(FormForbiddenError);
  });
});

describe("ConditionService.updateCondition", () => {
  it("patches operator/value/action atomically", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });

    const updated = await conditionSvc.updateCondition({
      conditionId: cond.id,
      userId: USER_A.id,
      patch: { operator: "neq", value: "no", action: "hide" },
    });
    expect(updated.operator).toBe("neq");
    expect(updated.value).toBe("no");
    expect(updated.action).toBe("hide");
    expect(updated.targetFieldId).toBe(tgt.id);
  });

  it("rejects an update that breaks XOR", async () => {
    const { form, section, src, tgt } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });

    await expect(
      conditionSvc.updateCondition({
        conditionId: cond.id,
        userId: USER_A.id,
        patch: { targetSectionId: section.id },
      }),
    ).rejects.toThrow(ConditionInvalidTargetError);
  });

  it("throws ConditionNotFoundError for unknown id", async () => {
    await expect(
      conditionSvc.updateCondition({
        conditionId: "11111111-1111-4111-8111-111111111111",
        userId: USER_A.id,
        patch: { value: "x" },
      }),
    ).rejects.toThrow(ConditionNotFoundError);
  });
});

describe("ConditionService.deleteCondition", () => {
  it("soft-deletes the condition", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });

    await conditionSvc.deleteCondition({ conditionId: cond.id, userId: USER_A.id });

    const live = await conditionSvc.listByForm({ formId: form.id, userId: USER_A.id });
    expect(live).toHaveLength(0);

    const [row] = await db
      .select()
      .from(fieldConditionsTable)
      .where(eq(fieldConditionsTable.id, cond.id));
    expect(row?.deletedAt).not.toBeNull();
  });

  it("rejects delete on a published form", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    const cond = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "yes",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });
    await formSvc.publish({ id: form.id, userId: USER_A.id, version: form.version + 1 });

    await expect(
      conditionSvc.deleteCondition({ conditionId: cond.id, userId: USER_A.id }),
    ).rejects.toThrow(FormSchemaLockedError);
  });
});

describe("ConditionService.listByForm", () => {
  it("returns conditions ordered by createdAt", async () => {
    const { form, src, tgt } = await setupForm(USER_A.id);
    const c1 = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "1",
      action: "show",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });
    const c2 = await conditionSvc.addCondition({
      formId: form.id,
      userId: USER_A.id,
      sourceFieldId: src.id,
      operator: "eq",
      value: "2",
      action: "hide",
      targetFieldId: tgt.id,
      targetSectionId: null,
    });

    const list = await conditionSvc.listByForm({ formId: form.id, userId: USER_A.id });
    expect(list.map((c) => c.id)).toEqual([c1.id, c2.id]);
  });

  it("rejects non-owner", async () => {
    const { form } = await setupForm(USER_A.id);
    await expect(conditionSvc.listByForm({ formId: form.id, userId: USER_B.id })).rejects.toThrow(
      FormForbiddenError,
    );
  });
});
