"use client";

import { useMemo } from "react";
import {
  BOB_KANBAN_STATUSES,
  type BobSubmission,
  type BobSubmissionStatus,
} from "@/platform/api/bob/submissions";
import { SUBMISSION_STATUS_LABELS } from "@/features/bob/submissions/workflow/constants";

export interface KanbanColumn {
  status: BobSubmissionStatus;
  label: string;
  items: BobSubmission[];
}

export function useSubmissionKanban(
  submissions: BobSubmission[],
  options?: { archivedOnly?: boolean; includeArchivedColumn?: boolean },
) {
  return useMemo(() => {
    const archivedOnly = Boolean(options?.archivedOnly);
    const statuses: BobSubmissionStatus[] = archivedOnly
      ? ["archived"]
      : options?.includeArchivedColumn
        ? [...BOB_KANBAN_STATUSES, "archived"]
        : [...BOB_KANBAN_STATUSES];

    const map = new Map<BobSubmissionStatus, BobSubmission[]>();
    for (const st of statuses) map.set(st, []);
    for (const s of submissions) {
      if (!(statuses as readonly string[]).includes(s.status)) continue;
      const key = s.status as BobSubmissionStatus;
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return statuses.map((status) => ({
      status,
      label: SUBMISSION_STATUS_LABELS[status],
      items: (map.get(status) || []).sort(
        (a, b) =>
          new Date(b.lastTouchedAt).getTime() -
          new Date(a.lastTouchedAt).getTime(),
      ),
    }));
  }, [submissions, options?.archivedOnly, options?.includeArchivedColumn]);
}
