"use client";

import type { BobDeliverable } from "@/platform/api/bob/milestones";
import {
  REVIEW_STATUS_OPTIONS,
  TRACKER_STATUS_OPTIONS,
  APP_REVIEW_TO_TRACKER,
  TRACKER_TO_APP_REVIEW,
  reviewStatusBadge,
} from "../deliverableDisplay";
import {
  findTrackerForTeam,
  teamTrackerSummaries,
} from "../deliverableTeamReview";

export function DeliverableDetailDrawer({
  deliverable,
  teamName,
  updatingId,
  detailSaveError,
  onClose,
  onReviewChange,
  onOpenTeamReview,
}: {
  deliverable: BobDeliverable;
  teamName?: string;
  updatingId: string | null;
  detailSaveError: string | null;
  onClose: () => void;
  onReviewChange: (
    item: BobDeliverable,
    reviewStatus: string,
    trackerStatus?: string,
    teamName?: string,
  ) => void;
  onOpenTeamReview: (teamName: string) => void;
}) {
  const isTeamReview = Boolean(teamName);
  const tracker = findTrackerForTeam(deliverable, teamName);
  const teamSummaries = teamTrackerSummaries(deliverable);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-orange-700">
                {deliverable.trackName} · {deliverable.deliverableNumber}
              </p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {deliverable.deliverableName}
              </h2>
              {teamName ? (
                <p className="text-sm text-gray-600 mt-1">
                  Project team: <span className="font-medium">{teamName}</span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Planned start</dt>
              <dd className="font-medium">{deliverable.plannedStartDate || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Target completion</dt>
              <dd className="font-medium">
                {deliverable.targetCompletionDate || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium">{deliverable.typeOfMilestone || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Track progress</dt>
              <dd className="font-medium">{deliverable.progressStatus || "—"}</dd>
            </div>
          </dl>

          {deliverable.details ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                SMART goal & definition of done
              </h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3">
                {deliverable.details}
              </div>
            </div>
          ) : null}

          {!isTeamReview ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Track catalog deliverables are shared templates. Staff review status
              and notes live on each project team&apos;s tracker row — use the{" "}
              <span className="font-medium">By Team</span> tab to review.
            </div>
          ) : null}

          {detailSaveError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {detailSaveError}
            </div>
          ) : null}

          {updatingId === deliverable.id ? (
            <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              Saving to Airtable…
            </p>
          ) : null}

          {isTeamReview ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff review (tracker status)
                </label>
                <select
                  value={tracker?.deliverableStatus || ""}
                  disabled={updatingId === deliverable.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    onReviewChange(
                      deliverable,
                      TRACKER_TO_APP_REVIEW[v] || "pending_review",
                      v,
                      teamName,
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  <option value="">—</option>
                  {TRACKER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App review status
                </label>
                <select
                  value={
                    tracker?.reviewStatus || deliverable.reviewStatus || ""
                  }
                  disabled={updatingId === deliverable.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    onReviewChange(
                      deliverable,
                      v,
                      APP_REVIEW_TO_TRACKER[v],
                      teamName,
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  {REVIEW_STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {tracker?.staffReviewNotes ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Staff review notes
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3">
                    {tracker.staffReviewNotes}
                  </p>
                </div>
              ) : null}

              {tracker?.uploads?.length ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Team uploads
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {tracker.uploads.map((u) => (
                      <li key={u.id}>
                        <a
                          href={u.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 hover:underline"
                        >
                          {u.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Team review status
              </h3>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {teamSummaries.map(({ teamName: name, tracker: row }) => {
                  const badge = reviewStatusBadge(
                    row?.reviewStatus || "not_started",
                  );
                  return (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {name}
                        </p>
                        {row?.staffReviewNotes ? (
                          <p className="text-xs text-gray-500 truncate">
                            {row.staffReviewNotes}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenTeamReview(name)}
                        className="shrink-0 flex items-center gap-2"
                      >
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-orange-600 font-medium">
                          Review →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(deliverable.trackerRecords || []).length > 0 && isTeamReview ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Submission history
              </h3>
              <ul className="space-y-3">
                {(tracker ? [tracker] : deliverable.trackerRecords).map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg border border-gray-200 p-3 text-sm"
                  >
                    <p className="font-medium text-gray-900">
                      {t.date || "Submission"} ·{" "}
                      {t.deliverableStatus || "Status pending"}
                    </p>
                    {t.staffReviewNotes ? (
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                        {t.staffReviewNotes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {deliverable.finalDeliverableLinks ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Final links
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {deliverable.finalDeliverableLinks}
              </p>
            </div>
          ) : null}

        </div>
      </div>
    </>
  );
}
