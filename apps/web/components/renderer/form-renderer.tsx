"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getFieldTypeDef, type FieldType } from "@repo/schemas/fields";
import { trpc } from "~/trpc/client";
import type { RouterOutputs } from "@repo/trpc/client";
import { FieldRenderer } from "./field-renderer";

type FormShape = RouterOutputs["publicForm"]["getBySlug"];

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
    case "number":
    case "rating":
      return undefined;
    default:
      return "";
  }
}

export function FormRenderer({ form }: { form: FormShape }) {
  const router = useRouter();
  const allFields = form.sections.flatMap((s) => s.fields);

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
  });

  const submit = trpc.publicForm.submit.useMutation({
    onSuccess: () => router.push(`/f/${form.slug}/thanks`),
  });

  const onSubmit = (values: Record<string, unknown>) => {
    const answers = Object.entries(values)
      .filter(([, v]) => !isEmpty(v))
      .map(([fieldId, value]) => ({ fieldId, value }));
    submit.mutate({ slug: form.slug, answers });
  };

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
      {allFields.length === 0 && (
        <p className="text-sm text-neutral-500 italic">
          This form has no fields. Submit to record an empty response.
        </p>
      )}

      {allFields.map((field) => (
        <FieldRenderer key={field.id} field={field} control={methods.control} />
      ))}

      {submit.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {submit.error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={submit.isPending}
        className="w-full px-4 py-3 bg-neutral-900 text-white rounded-md font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submit.isPending ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
