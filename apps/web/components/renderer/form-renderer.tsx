"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getFieldTypeDef, type FieldType } from "@repo/schemas/fields";
import { evaluateConditions, type ConditionEvaluation } from "@repo/services/condition/evaluator";
import { trpc } from "~/trpc/client";
import type { FormField, FormSchema, FormSection } from "~/lib/api-types";
import { FieldRenderer } from "./field-renderer";

type FormShape = FormSchema;
type Section = FormSection;
type Field = FormField;

type Screen =
  | { kind: "page"; id: string; pageIndex: number; sections: Section[]; fieldIds: string[] }
  | { kind: "intro"; id: string; section: Section; fieldIds: [] }
  | {
      kind: "field";
      id: string;
      section: Section;
      field: Field;
      questionNumber: number;
      fieldIds: [string];
    };

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function defaultValueFor(type: FieldType): unknown {
  switch (type) {
    case "checkbox":
      return false;
    case "multi_select":
      return [];
    case "single_select":
    case "dropdown":
    case "number":
    case "rating":
      return undefined;
    default:
      return "";
  }
}

function filterVisible(form: FormShape, evaluation: ConditionEvaluation) {
  const visibleSections = form.sections
    .filter((s) => !evaluation.hiddenSectionIds.has(s.id))
    .map((s) => ({
      ...s,
      fields: s.fields.filter((f) => !evaluation.hiddenFieldIds.has(f.id)),
    }));
  return { ...form, sections: visibleSections };
}

function buildScreens(form: FormShape): Screen[] {
  if (form.layout === "single_page") {
    const pages: Screen[] = [];
    let bucket: Section[] = [];
    const flush = () => {
      if (bucket.length === 0) return;
      const fieldIds = bucket.flatMap((c) => c.fields.map((f) => f.id));
      const pageIndex = pages.length;
      pages.push({
        kind: "page",
        id: `page:${pageIndex}`,
        pageIndex,
        sections: bucket,
        fieldIds,
      });
      bucket = [];
    };
    for (const s of form.sections) {
      if (s.pageBreakBefore && bucket.length > 0) flush();
      bucket.push(s);
    }
    flush();
    return pages;
  }

  const screens: Screen[] = [];
  let questionNumber = 0;
  for (const s of form.sections) {
    if (s.showIntroScreen && (s.title || s.description)) {
      screens.push({ kind: "intro", id: `intro:${s.id}`, section: s, fieldIds: [] });
    }
    for (const f of s.fields) {
      questionNumber += 1;
      screens.push({
        kind: "field",
        id: `field:${f.id}`,
        section: s,
        field: f,
        questionNumber,
        fieldIds: [f.id],
      });
    }
  }
  return screens;
}

function friendlySubmitError(message: string | undefined): string {
  const raw = message ?? "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("invalid input") ||
    lower.includes("invalid value") ||
    lower.includes("expected") ||
    lower.includes("required")
  ) {
    return "Some answers need attention. Please review the highlighted question and try again.";
  }
  if (lower.includes("not accepting") || lower.includes("not published")) {
    return "This form is not accepting responses right now.";
  }
  if (lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "Something went wrong. Please try again.";
}

export function FormRenderer({
  form,
  previewMode = false,
}: {
  form: FormShape;
  previewMode?: boolean;
}) {
  const router = useRouter();
  const allFields = form.sections.flatMap((s) => s.fields);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const field of allFields) {
      const def = getFieldTypeDef(field.type);
      const optionValues = field.options.map((o) => o.value);
      shape[field.id] = def.buildAnswerSchema(field, optionValues);
    }
    return z.object(shape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  const defaultValues = useMemo(() => {
    const dv: Record<string, unknown> = {};
    for (const f of allFields) dv[f.id] = defaultValueFor(f.type);
    return dv;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
    shouldUnregister: false,
  });
  const [answerValues, setAnswerValues] = useState<Record<string, unknown>>(() => defaultValues);

  useEffect(() => {
    methods.reset(defaultValues);
    setAnswerValues(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  const rememberValue = (fieldId: string, value: unknown) => {
    setAnswerValues((current) => ({ ...current, [fieldId]: value }));
  };

  const submit = trpc.publicForm.submit.useMutation({
    onSuccess: () => router.push(`/f/${form.slug}/thanks`),
  });

  const evaluation = useMemo(
    () => evaluateConditions({ conditions: form.conditions, answers: answerValues }),
    [answerValues, form.conditions],
  );

  const visibleForm = useMemo(() => filterVisible(form, evaluation), [form, evaluation]);
  const screens = useMemo(() => buildScreens(visibleForm), [visibleForm]);
  const totalSteps = screens.length;

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const effectiveCurrentId =
    currentId && screens.some((s) => s.id === currentId) ? currentId : (screens[0]?.id ?? null);
  const currentIndex =
    effectiveCurrentId === null ? -1 : screens.findIndex((s) => s.id === effectiveCurrentId);
  const current = currentIndex >= 0 ? screens[currentIndex] : undefined;

  const visibleFieldIds = new Set(visibleForm.sections.flatMap((s) => s.fields.map((f) => f.id)));

  const submitValues = (values: Record<string, unknown>) => {
    if (previewMode) {
      setPreviewSubmitted(true);
      return;
    }
    const answers = Object.entries(values)
      .filter(([fieldId, v]) => visibleFieldIds.has(fieldId) && !isEmpty(v))
      .map(([fieldId, value]) => ({ fieldId, value }));
    submit.mutate({ slug: form.slug, answers, honeypot });
  };

  const honeypotField = (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={honeypot}
      onChange={(e) => setHoneypot(e.target.value)}
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
      name="company_website"
    />
  );

  if (totalSteps === 0 || !current) {
    return (
      <form
        onSubmit={methods.handleSubmit(() => {
          if (previewMode) {
            setPreviewSubmitted(true);
            return;
          }
          submit.mutate({ slug: form.slug, answers: [], honeypot });
        })}
        className="space-y-6"
      >
        {honeypotField}
        <p className="sensus-muted text-sm italic">
          This form has no visible fields. Submit to record an empty response.
        </p>
        {previewSubmitted && <PreviewSubmittedBanner />}
        <button
          type="submit"
          disabled={submit.isPending}
          className="sensus-button-primary w-full px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submit.isPending ? "Submitting…" : previewMode ? "Submit (preview)" : "Submit"}
        </button>
      </form>
    );
  }

  const isLast = currentIndex === totalSteps - 1;

  const validateVisible = async (): Promise<boolean> => {
    const fieldsToValidate = current.fieldIds.filter((id) => visibleFieldIds.has(id));
    let staticOk = true;
    if (fieldsToValidate.length > 0) {
      staticOk = await methods.trigger(fieldsToValidate);
    }

    let dynamicOk = true;
    for (const fieldId of fieldsToValidate) {
      if (evaluation.requiredFieldIds.has(fieldId)) {
        const value = methods.getValues(fieldId);
        if (isEmpty(value)) {
          methods.setError(fieldId, {
            type: "required-by-condition",
            message: "This field is required",
          });
          dynamicOk = false;
        }
      }
    }

    return staticOk && dynamicOk;
  };

  const findNextStepId = (): string | null => {
    if (form.layout === "one_per_screen" && current.kind === "field") {
      const jump = evaluation.jumpTargets.get(current.field.id);
      if (jump) {
        const wantedId = jump.type === "field" ? `field:${jump.id}` : `intro:${jump.id}`;
        const targetIndex = screens.findIndex((s) => s.id === wantedId);
        if (targetIndex >= 0) return screens[targetIndex]?.id ?? null;
        if (jump.type === "section") {
          const fallback = screens.findIndex((s) => s.kind === "field" && s.section.id === jump.id);
          if (fallback >= 0) return screens[fallback]?.id ?? null;
        }
      }
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalSteps) return null;
    return screens[nextIndex]?.id ?? null;
  };

  const handleNext = async () => {
    const valid = await validateVisible();
    if (!valid) return;
    const nextId = findNextStepId();
    if (!nextId) return;
    setHistory((h) => [...h, current.id]);
    setCurrentId(nextId);
  };

  const handleBack = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setCurrentId(previous);
  };

  const showBack = history.length > 0;
  const showSubmit = isLast || (form.layout === "one_per_screen" && findNextStepId() === null);

  const handleSubmit = async () => {
    const valid = await validateVisible();
    if (!valid) return;

    const values = { ...methods.getValues(), ...answerValues };
    for (const fieldId of current.fieldIds) {
      values[fieldId] = methods.getValues(fieldId);
    }
    submitValues(values);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="space-y-6"
    >
      {honeypotField}
      <ProgressIndicator layout={form.layout} screens={screens} currentIndex={currentIndex} />

      <div className="space-y-6">
        {current.kind === "page" &&
          current.sections.map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              control={methods.control}
              onValueChange={rememberValue}
            />
          ))}

        {current.kind === "intro" && <SectionIntro section={current.section} />}

        {current.kind === "field" && (
          <FieldRenderer
            field={current.field}
            control={methods.control}
            onValueChange={rememberValue}
          />
        )}
      </div>

      {submit.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {friendlySubmitError(submit.error.message)}
        </div>
      )}

      {previewSubmitted && <PreviewSubmittedBanner />}

      <div className="flex items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-3 border border-current rounded-md font-medium hover:opacity-70 transition"
          >
            Back
          </button>
        )}

        {!showSubmit ? (
          <button
            type="button"
            onClick={handleNext}
            className="sensus-button-primary flex-1 px-4 py-3 font-medium transition"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={submit.isPending}
            className="sensus-button-primary flex-1 px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submit.isPending ? "Submitting…" : previewMode ? "Submit (preview)" : "Submit"}
          </button>
        )}
      </div>
    </form>
  );
}

function PreviewSubmittedBanner() {
  return (
    <div
      role="status"
      className="p-3 rounded text-sm"
      style={{
        background: "var(--sensus-surface, #fff)",
        border: "1px solid var(--sensus-primary, #0f172a)",
        color: "var(--sensus-primary, #0f172a)",
      }}
    >
      Preview mode — submissions are disabled. On the live form this would record a response.
    </div>
  );
}

function SectionBlock({
  section,
  control,
  onValueChange,
}: {
  section: Section;
  control: Parameters<typeof FieldRenderer>[0]["control"];
  onValueChange: NonNullable<Parameters<typeof FieldRenderer>[0]["onValueChange"]>;
}) {
  return (
    <section className="space-y-4">
      {(section.title || section.description) && (
        <header className="space-y-1">
          {section.title && <h2 className="text-lg font-semibold">{section.title}</h2>}
          {section.description && <p className="sensus-muted text-sm">{section.description}</p>}
        </header>
      )}
      {section.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          control={control}
          onValueChange={onValueChange}
        />
      ))}
    </section>
  );
}

function SectionIntro({ section }: { section: Section }) {
  return (
    <section className="text-center py-8 space-y-3">
      {section.title && <h2 className="text-3xl font-semibold">{section.title}</h2>}
      {section.description && <p className="sensus-muted text-base">{section.description}</p>}
    </section>
  );
}

function ProgressIndicator({
  layout,
  screens,
  currentIndex,
}: {
  layout: FormShape["layout"];
  screens: Screen[];
  currentIndex: number;
}) {
  const current = screens[currentIndex];
  if (!current) return null;

  if (layout === "single_page") {
    if (screens.length <= 1) return null;
    const total = screens.length;
    return (
      <div className="space-y-1">
        <p className="sensus-muted text-xs">
          Page {currentIndex + 1} of {total}
        </p>
        <ProgressBar value={(currentIndex + 1) / total} />
      </div>
    );
  }

  const fieldScreens = screens.filter((s) => s.kind === "field");
  const totalQuestions = fieldScreens.length;
  if (totalQuestions === 0) return null;

  const currentQuestionNumber =
    current.kind === "field"
      ? current.questionNumber
      : findNextQuestionNumber(screens, currentIndex);

  return (
    <div className="space-y-1">
      <p className="sensus-muted text-xs">
        {current.kind === "intro"
          ? "Section intro"
          : `Question ${currentQuestionNumber} of ${totalQuestions}`}
      </p>
      <ProgressBar value={currentQuestionNumber / totalQuestions} />
    </div>
  );
}

function findNextQuestionNumber(screens: Screen[], fromIndex: number): number {
  for (let i = fromIndex; i < screens.length; i++) {
    const s = screens[i];
    if (s?.kind === "field") return s.questionNumber;
  }
  return 0;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className="h-1 w-full rounded-full overflow-hidden"
      style={{ background: "var(--sensus-muted, #e5e5e5)" }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: "var(--sensus-primary, #0f172a)",
        }}
      />
    </div>
  );
}
