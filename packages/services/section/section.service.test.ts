import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { themesTable, user as userTable, formSectionsTable, eq, type Pool } from "@repo/database";
import { createTestDb, setupTestDb, cleanTestDb } from "@repo/database/test-utils";

import { FormService, FormForbiddenError, FormSchemaLockedError } from "../form/form.service";
import { FieldService } from "../field/field.service";
import {
  SectionService,
  SectionNotFoundError,
  SectionHasFieldsError,
  LastSectionError,
} from "./section.service";

type TestDb = ReturnType<typeof createTestDb>["db"];

let db: TestDb;
let pool: Pool;
let formSvc: FormService;
let fieldSvc: FieldService;
let sectionSvc: SectionService;

const USER_A = { id: "user_a", name: "A", email: "a@example.com", emailVerified: false };
const USER_B = { id: "user_b", name: "B", email: "b@example.com", emailVerified: false };
let themeId: string;

beforeAll(async () => {
  const handle = createTestDb();
  db = handle.db;
  pool = handle.pool;
  await setupTestDb(db);
  formSvc = new FormService(db);
  fieldSvc = new FieldService(db);
  sectionSvc = new SectionService(db);
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

async function newDraftForm(userId: string) {
  return formSvc.create({ userId, input: { title: "F", themeId } });
}

describe("SectionService.addSection", () => {
  it("appends a new section with an incrementing order", async () => {
    const form = await newDraftForm(USER_A.id);
    const second = await sectionSvc.addSection({ formId: form.id, userId: USER_A.id });
    expect(second.order).toBe(1);

    const all = await sectionSvc.listByForm({ formId: form.id });
    expect(all).toHaveLength(2);
    expect(all.map((s) => s.order)).toEqual([0, 1]);
  });

  it("rejects non-owners", async () => {
    const form = await newDraftForm(USER_A.id);
    await expect(sectionSvc.addSection({ formId: form.id, userId: USER_B.id })).rejects.toThrow(
      FormForbiddenError,
    );
  });

  it("rejects on published forms (schema lock)", async () => {
    const form = await newDraftForm(USER_A.id);
    await formSvc.publish({ id: form.id, userId: USER_A.id, version: form.version });
    await expect(sectionSvc.addSection({ formId: form.id, userId: USER_A.id })).rejects.toThrow(
      FormSchemaLockedError,
    );
  });
});

describe("SectionService.updateSection", () => {
  it("patches title / description / flags", async () => {
    const form = await newDraftForm(USER_A.id);
    const [first] = await sectionSvc.listByForm({ formId: form.id });
    if (!first) throw new Error("seed");

    const updated = await sectionSvc.updateSection({
      sectionId: first.id,
      userId: USER_A.id,
      patch: {
        title: "Welcome",
        description: "First page",
        pageBreakBefore: true,
        showIntroScreen: true,
      },
    });

    expect(updated.title).toBe("Welcome");
    expect(updated.description).toBe("First page");
    expect(updated.pageBreakBefore).toBe(true);
    expect(updated.showIntroScreen).toBe(true);
  });

  it("throws SectionNotFoundError for unknown id", async () => {
    await expect(
      sectionSvc.updateSection({
        sectionId: "11111111-1111-4111-8111-111111111111",
        userId: USER_A.id,
        patch: { title: "x" },
      }),
    ).rejects.toThrow(SectionNotFoundError);
  });
});

describe("SectionService.deleteSection", () => {
  it("soft-deletes an empty non-last section", async () => {
    const form = await newDraftForm(USER_A.id);
    const second = await sectionSvc.addSection({ formId: form.id, userId: USER_A.id });

    await sectionSvc.deleteSection({ sectionId: second.id, userId: USER_A.id });

    const live = await sectionSvc.listByForm({ formId: form.id });
    expect(live).toHaveLength(1);

    const [row] = await db
      .select()
      .from(formSectionsTable)
      .where(eq(formSectionsTable.id, second.id));
    expect(row?.deletedAt).not.toBeNull();
  });

  it("refuses to delete the last section", async () => {
    const form = await newDraftForm(USER_A.id);
    const [only] = await sectionSvc.listByForm({ formId: form.id });
    if (!only) throw new Error("seed");

    await expect(
      sectionSvc.deleteSection({ sectionId: only.id, userId: USER_A.id }),
    ).rejects.toThrow(LastSectionError);
  });

  it("refuses to delete a section that has live fields", async () => {
    const form = await newDraftForm(USER_A.id);
    const second = await sectionSvc.addSection({ formId: form.id, userId: USER_A.id });
    await fieldSvc.addField({
      formId: form.id,
      userId: USER_A.id,
      sectionId: second.id,
      type: "short_text",
      label: "Q",
    });

    await expect(
      sectionSvc.deleteSection({ sectionId: second.id, userId: USER_A.id }),
    ).rejects.toThrow(SectionHasFieldsError);
  });
});

describe("SectionService.reorderSections", () => {
  it("updates the order column to match the supplied id list", async () => {
    const form = await newDraftForm(USER_A.id);
    const second = await sectionSvc.addSection({ formId: form.id, userId: USER_A.id });
    const third = await sectionSvc.addSection({ formId: form.id, userId: USER_A.id });
    const [first] = await sectionSvc.listByForm({ formId: form.id });
    if (!first) throw new Error("seed");

    await sectionSvc.reorderSections({
      formId: form.id,
      userId: USER_A.id,
      orderedIds: [third.id, first.id, second.id],
    });

    const live = await sectionSvc.listByForm({ formId: form.id });
    expect(live.map((s) => s.id)).toEqual([third.id, first.id, second.id]);
    expect(live.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("rejects an id list that doesn't match the live sections exactly", async () => {
    const form = await newDraftForm(USER_A.id);
    const [first] = await sectionSvc.listByForm({ formId: form.id });
    if (!first) throw new Error("seed");

    await expect(
      sectionSvc.reorderSections({
        formId: form.id,
        userId: USER_A.id,
        orderedIds: [first.id, "11111111-1111-4111-8111-111111111111"],
      }),
    ).rejects.toThrow(SectionNotFoundError);
  });
});
