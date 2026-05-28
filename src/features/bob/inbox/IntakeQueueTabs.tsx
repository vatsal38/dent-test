"use client";

import type { BobRecruitmentFacetsResponse } from "@/platform/api/bob/recruitment";
import {
  INTAKE_QUEUES,
  intakeQueueCount,
  type IntakeQueueId,
} from "@/features/bob/inbox/queues";

export function IntakeQueueTabs({
  active,
  facets,
  onChange,
}: {
  active: IntakeQueueId;
  facets: BobRecruitmentFacetsResponse | null | undefined;
  onChange: (queue: IntakeQueueId) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin"
      role="tablist"
      aria-label="Intake queues"
    >
      {INTAKE_QUEUES.map((q) => {
        const selected = q.id === active;
        const count = intakeQueueCount(q.id, facets);
        return (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(q.id)}
            title={q.description}
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selected
                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50"
            }`}
          >
            <span>{q.label}</span>
            {count != null ? (
              <span
                className={`tabular-nums text-xs px-1.5 py-0.5 rounded-full ${
                  selected
                    ? "bg-orange-600/80 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
