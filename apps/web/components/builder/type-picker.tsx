"use client";

import { FIELD_TYPES_CATALOG, type FieldType } from "@repo/schemas/fields";
import { FIELD_ICONS } from "~/lib/field-meta";

export function TypePicker({ onPick }: { onPick: (type: FieldType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(FIELD_TYPES_CATALOG).map((def) => {
        const Icon = FIELD_ICONS[def.type];
        return (
          <button
            key={def.type}
            type="button"
            onClick={() => onPick(def.type)}
            className="flex items-start gap-3 p-3 border border-neutral-200 rounded hover:border-neutral-900 hover:bg-neutral-50 transition text-left"
          >
            <Icon className="h-5 w-5 mt-0.5 text-neutral-700 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm">{def.label}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{def.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
