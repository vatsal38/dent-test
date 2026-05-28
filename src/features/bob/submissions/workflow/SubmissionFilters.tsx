"use client";

import {
  BOB_SUBMISSION_STATUSES,
  BOB_SUBMISSION_TYPES,
  type BobSubmissionStatus,
  type BobSubmissionType,
} from "@/platform/api/bob/submissions";
import type { BobSubmissionFacets } from "@/platform/api/bob/submissions";
import {
  PRIORITY_OPTIONS,
  SEVERITY_OPTIONS,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/features/bob/submissions/workflow/constants";
import type { SubmissionFilterState } from "@/features/bob/submissions/workflow/filters";

export function SubmissionFilters({
  filters,
  onChange,
  facets,
}: {
  filters: SubmissionFilterState;
  onChange: (next: SubmissionFilterState) => void;
  facets?: BobSubmissionFacets;
}) {
  const set = (patch: Partial<SubmissionFilterState>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
      <div className="md:col-span-3">
        <input
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search submissions…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          aria-label="Search submissions"
        />
      </div>
      <div className="md:col-span-2">
        <select
          value={filters.type}
          onChange={(e) =>
            set({ type: e.target.value as BobSubmissionType | "" })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">All types</option>
          {BOB_SUBMISSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {SUBMISSION_TYPE_LABELS[t]}
              {facets?.type[t] != null ? ` (${facets.type[t]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <select
          value={filters.status}
          onChange={(e) =>
            set({ status: e.target.value as BobSubmissionStatus | "" })
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">All statuses</option>
          {BOB_SUBMISSION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SUBMISSION_STATUS_LABELS[s]}
              {facets?.status[s] != null ? ` (${facets.status[s]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <select
          value={filters.priority}
          onChange={(e) => set({ priority: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Any priority</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
              {facets?.priority[p] != null ? ` (${facets.priority[p]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <select
          value={filters.severity}
          onChange={(e) => set({ severity: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          <option value="">Any severity</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-1 flex flex-col gap-1 justify-center text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.showOnlyMine}
            onChange={(e) => set({ showOnlyMine: e.target.checked })}
            className="rounded border-gray-300 text-orange-600"
          />
          Mine
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={filters.excludeArchived && !filters.archivedOnly}
            disabled={filters.archivedOnly}
            onChange={(e) =>
              set({
                excludeArchived: e.target.checked,
                archivedOnly: false,
              })
            }
            className="rounded border-gray-300 text-orange-600"
          />
          Hide archived
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={filters.archivedOnly}
            onChange={(e) =>
              set({
                archivedOnly: e.target.checked,
                excludeArchived: !e.target.checked,
                status: e.target.checked ? "archived" : "",
              })
            }
            className="rounded border-gray-300 text-orange-600"
          />
          Archived only
        </label>
      </div>
    </div>
  );
}
