"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";

export function DangerZone({
  formId,
  status,
  version,
}: {
  formId: string;
  status: "draft" | "published" | "unpublished" | "archived";
  version: number;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const unpublish = trpc.forms.unpublish.useMutation({
    onSuccess: () => {
      utils.forms.get.invalidate({ id: formId });
      utils.forms.list.invalidate();
    },
  });

  const softDelete = trpc.forms.softDelete.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
      router.push("/dashboard");
    },
  });

  return (
    <section className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
      <header>
        <h3 className="font-semibold text-red-900">Danger zone</h3>
        <p className="text-xs text-red-700 mt-0.5">
          Unpublishing keeps responses but removes the form from public access. Deleting hides the
          form from your dashboard and all listings.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {status === "published" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => unpublish.mutate({ id: formId, version })}
            disabled={unpublish.isPending}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {unpublish.isPending ? "Unpublishing…" : "Unpublish"}
          </Button>
        )}

        {!confirmDelete ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Delete form
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-red-800">
            <span>Delete this form?</span>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => softDelete.mutate({ id: formId })}
              disabled={softDelete.isPending}
            >
              {softDelete.isPending ? "Deleting…" : "Yes, delete"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {(unpublish.error || softDelete.error) && (
        <p className="text-xs text-red-700">
          {unpublish.error?.message ?? softDelete.error?.message}
        </p>
      )}
    </section>
  );
}
