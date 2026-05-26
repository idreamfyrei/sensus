import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  eq,
  formsTable,
  formSectionsTable,
  formFieldsTable,
  fieldOptionsTable,
  themesTable,
  user as userTable,
  type Pool,
} from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";
import { FieldService, FieldNotFoundError, FormSchemaLockedError, FormService } from "../index";
import { FormForbiddenError } from "../form/form.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let formSvc: FormService;
let fieldSvc: FieldService;

const USER_A = {
  id: "user_field_a",
  name: "A",
  email: "a@example.com",
  emailVerified: false,
};
const USER_B = {
  id: "user_field_b",
  name: "B",
  email: "b@example.com",
  emailVerified: false,
};
let themeId: string;

beforeAll(async () => {
  const h = createTestDb();
  db = h.db;
  pool = h.pool;
  await setupTestDb(db);
  formSvc = new FormService(db);
  fieldSvc = new FieldService(db);
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
      fontHeading: "sans",
      fontBody: "sans",
    })
    .returning();
  themeId = theme!.id;
});

afterAll(async () => {
  await pool.end();
});

async function makeDraftForm(userId: string) {
  const form = await formSvc.create({ userId, input: { title: "F", themeId } });
  // form.create auto-creates the default section; load it.
  const [section] = await db
    .select()
    .from(formSectionsTable)
    .where(eq(formSectionsTable.formId, form.id));
  if (!section) throw new Error("default section missing");
  return { form, section };
}

describe("FormService.create", () => {
  it("auto-creates a default section", async () => {
    const { form } = await makeDraftForm(USER_A.id);
    const sections = await db
      .select()
      .from(formSectionsTable)
      .where(eq(formSectionsTable.formId, form.id));
    expect(sections).toHaveLength(1);
    expect(sections[0]?.order).toBe(0);
  });
});

describe("FieldService.addField", () => {
  it("adds a field with auto-incrementing order and bumps form version", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);

    const f1 = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "short_text",
      label: "Q1",
    });
    expect(f1.order).toBe(0);

    const f2 = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "long_text",
      label: "Q2",
    });
    expect(f2.order).toBe(1);

    const [refreshed] = await db.select().from(formsTable).where(eq(formsTable.id, form.id));
    expect(refreshed?.version).toBe(3); // 1 (initial) + 2 mutations
  });

  it("rejects non-owner", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    await expect(
      fieldSvc.addField({
        formId: form.id,
        userId: USER_B.id,
        sectionId: section.id,
        type: "short_text",
        label: "Q",
      }),
    ).rejects.toThrow(FormForbiddenError);
  });

  it("rejects when the form is published (schema locked)", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    await formSvc.publish({ id: form.id, userId: USER_A.id, version: form.version });

    await expect(
      fieldSvc.addField({
        formId: form.id,
        userId: USER_A.id,
        sectionId: section.id,
        type: "short_text",
        label: "Q",
      }),
    ).rejects.toThrow(FormSchemaLockedError);
  });
});

describe("FieldService.updateField", () => {
  it("patches the field's label + required", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    const f = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "short_text",
      label: "Q",
    });

    const updated = await fieldSvc.updateField({
      fieldId: f.id,
      userId: USER_A.id,
      patch: { label: "Updated", required: true },
    });
    expect(updated.label).toBe("Updated");
    expect(updated.required).toBe(true);
  });

  it("throws FieldNotFoundError for unknown id", async () => {
    await expect(
      fieldSvc.updateField({
        fieldId: "11111111-1111-4111-8111-111111111111",
        userId: USER_A.id,
        patch: { label: "x" },
      }),
    ).rejects.toThrow(FieldNotFoundError);
  });
});

describe("FieldService.deleteField", () => {
  it("soft-deletes the field and its options", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    const f = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "single_select",
      label: "Pick",
    });
    await fieldSvc.setOptions({
      fieldId: f.id,
      userId: USER_A.id,
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    });

    await fieldSvc.deleteField({ fieldId: f.id, userId: USER_A.id });

    const [field] = await db.select().from(formFieldsTable).where(eq(formFieldsTable.id, f.id));
    expect(field?.deletedAt).toBeInstanceOf(Date);

    const options = await db
      .select()
      .from(fieldOptionsTable)
      .where(eq(fieldOptionsTable.fieldId, f.id));
    expect(options.every((o) => o.deletedAt != null)).toBe(true);
  });
});

describe("FieldService.setOptions", () => {
  it("wipes existing and inserts the new set", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    const f = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "dropdown",
      label: "Pick",
    });

    await fieldSvc.setOptions({
      fieldId: f.id,
      userId: USER_A.id,
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    });

    const updated = await fieldSvc.setOptions({
      fieldId: f.id,
      userId: USER_A.id,
      options: [{ label: "C", value: "c" }],
    });
    expect(updated).toHaveLength(1);
    expect(updated[0]?.value).toBe("c");

    // Old options soft-deleted, not hard-deleted.
    const all = await db
      .select()
      .from(fieldOptionsTable)
      .where(eq(fieldOptionsTable.fieldId, f.id));
    expect(all.length).toBeGreaterThanOrEqual(3);
    const active = all.filter((o) => o.deletedAt == null);
    expect(active).toHaveLength(1);
  });
});

describe("FormService.publish gate", () => {
  it("rejects publish when a select-style field has no options", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "single_select",
      label: "Pick",
    });

    const fresh = await formSvc.getById({ id: form.id, userId: USER_A.id });
    await expect(
      formSvc.publish({ id: form.id, userId: USER_A.id, version: fresh.version }),
    ).rejects.toMatchObject({ code: "FIELD_OPTIONS_REQUIRED" });
  });

  it("allows publish once the select field has options", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    const f = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "single_select",
      label: "Pick",
    });
    await fieldSvc.setOptions({
      fieldId: f.id,
      userId: USER_A.id,
      options: [{ label: "A", value: "a" }],
    });

    const fresh = await formSvc.getById({ id: form.id, userId: USER_A.id });
    const published = await formSvc.publish({
      id: form.id,
      userId: USER_A.id,
      version: fresh.version,
    });
    expect(published.status).toBe("published");
  });
});

describe("FormService.getByIdWithSchema", () => {
  it("returns sections > fields > options nested", async () => {
    const { form, section } = await makeDraftForm(USER_A.id);
    const f = await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: section.id,
      type: "dropdown",
      label: "City",
    });
    await fieldSvc.setOptions({
      fieldId: f.id,
      userId: USER_A.id,
      options: [
        { label: "London", value: "lon" },
        { label: "Tokyo", value: "tyo" },
      ],
    });

    const enriched = await formSvc.getByIdWithSchema({ id: form.id, userId: USER_A.id });
    expect(enriched.sections).toHaveLength(1);
    expect(enriched.sections[0]?.fields).toHaveLength(1);
    expect(enriched.sections[0]?.fields[0]?.label).toBe("City");
    expect(enriched.sections[0]?.fields[0]?.options).toHaveLength(2);
  });
});
