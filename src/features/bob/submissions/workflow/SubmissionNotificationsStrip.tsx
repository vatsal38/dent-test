"use client";

import { cardTitle, formatWhen } from "@/features/bob/submissions/display";
import { useBobSubmissionNotifications } from "@/platform/query/hooks/useBobSubmissions";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

export function SubmissionNotificationsStrip({
  onOpenSubmission,
}: {
  onOpenSubmission: (id: string) => void;
}) {
  const access = useBobAccess();
  const orgWide = access.can("inbox.notificationsAll");
  const { data, isLoading } = useBobSubmissionNotifications(orgWide);
  const items = data?.submissions ?? [];
  const events = data?.events ?? [];

  if (isLoading && !data) return null;
  if (items.length === 0 && events.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-amber-900">
        {orgWide ? "Open submissions (org)" : "Needs your attention"}
      </h3>
      <ul className="mt-2 space-y-1">
        {items.slice(0, 6).map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onOpenSubmission(s.id)}
              className="text-sm text-amber-950 hover:underline text-left"
            >
              {cardTitle(s)} · {s.status.replace(/_/g, " ")}
              {s.assignedToLabel ? ` · ${s.assignedToLabel}` : ""}
            </button>
          </li>
        ))}
      </ul>
      {events.length > 0 ? (
        <ul className="mt-3 pt-3 border-t border-amber-200/80 space-y-1">
          {events.slice(0, 4).map((e) => (
            <li key={e.id} className="text-xs text-amber-800">
              {e.message}
              {e.submissionId ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => onOpenSubmission(e.submissionId!)}
                  >
                    View
                  </button>
                </>
              ) : null}
              <span className="text-amber-600 ml-1">
                {formatWhen(e.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
