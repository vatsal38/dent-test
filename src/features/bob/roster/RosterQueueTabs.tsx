"use client";

import type { BobStudentsFacetsResponse } from "@/platform/api/bob/students";
import {
  ROSTER_QUEUES,
  rosterQueueCount,
  type RosterQueueId,
} from "@/features/bob/roster/queues";

export function RosterQueueTabs({
  active,
  facets,
  onChange,
}: {
  active: RosterQueueId;
  facets: BobStudentsFacetsResponse | null | undefined;
  onChange: (queue: RosterQueueId) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label="Roster queues"
    >
      {ROSTER_QUEUES.map((q) => {
        const selected = q.id === active;
        const count = rosterQueueCount(q.id, facets);
        return (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={q.description}
            onClick={() => onChange(q.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selected
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-200 hover:border-orange-200"
            }`}
          >
            {q.label}
            {count != null ? (
              <span
                className={`tabular-nums text-xs px-1.5 py-0.5 rounded-full ${
                  selected ? "bg-orange-600/80 text-white" : "bg-gray-100 text-gray-600"
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
