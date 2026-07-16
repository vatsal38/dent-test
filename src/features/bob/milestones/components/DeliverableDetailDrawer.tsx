"use client";

import { useEffect, useState } from "react";
import type { BobDeliverable } from "@/platform/api/bob/milestones";
import {
  TRACKER_STATUS_OPTIONS,
  TRACKER_TO_APP_REVIEW,
  reviewStatusBadge,
} from "../deliverableDisplay";
import {
  findTrackerForTeam,
  teamNameMatchesFilter,
  teamReviewStatus,
  teamTrackerSummaries,
} from "../deliverableTeamReview";
import { DeliverableWeeklySubmissions } from "./DeliverableWeeklySubmissions";

export function DeliverableDetailDrawer({
  deliverable,
  teamName,
  allowedTeamNames,
  updatingId,
  detailSaveError,
  onClose,
  onReviewChange,
  onSaveStaffReview,
  onOpenTeamReview,
  defaultReviewerName = "",
}: {
  deliverable: BobDeliverable;
  teamName?: string;
  /** 100B — only show BoB '26 Project Teams in catalog team list */
  allowedTeamNames?: string[];
  updatingId: string | null;
  detailSaveError: string | null;
  onClose: () => void;
  onReviewChange: (
    item: BobDeliverable,
    reviewStatus: string,
    trackerStatus?: string,
    teamName?: string,
    reviewedBy?: string,
  ) => void;
  onSaveStaffReview: (
    item: BobDeliverable,
    payload: {
      staffReviewNotes: string;
      reviewedBy: string;
      teamName?: string;
    },
  ) => void;
  onOpenTeamReview: (teamName: string) => void;
  defaultReviewerName?: string;
}) {
  const isTeamReview = Boolean(teamName);
  const tracker = findTrackerForTeam(deliverable, teamName);
  const teamSummaries = teamTrackerSummaries(deliverable).filter((row) => {
    if (!allowedTeamNames?.length) return true;
    if (row.teamName === "Unassigned") return false;
    return allowedTeamNames.some((allowed) =>
      teamNameMatchesFilter(row.teamName, allowed),
    );
  });
  const [reviewNotes, setReviewNotes] = useState(tracker?.staffReviewNotes || "");
  const [reviewedBy, setReviewedBy] = useState(
    tracker?.reviewedBy || defaultReviewerName || "",
  );

  useEffect(() => {
    setReviewNotes(tracker?.staffReviewNotes || "");
    setReviewedBy(tracker?.reviewedBy || defaultReviewerName || "");
  }, [deliverable.id, teamName, tracker?.staffReviewNotes, tracker?.reviewedBy, defaultReviewerName]);

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
              {(tracker?.deliverableStatus === "Completed" ||
                tracker?.reviewStatus === "approved") &&
              tracker?.reviewedBy ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                  Marked complete by{" "}
                  <span className="font-medium">{tracker.reviewedBy}</span>
                  {tracker.reviewedAt
                    ? ` · ${new Date(tracker.reviewedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}`
                    : ""}
                </div>
              ) : null}

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
                      TRACKER_TO_APP_REVIEW[v] || "not_started",
                      v,
                      teamName,
                      reviewedBy.trim() || defaultReviewerName,
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
                <p className="text-[11px] text-gray-500 mt-1">
                  Staff set this step. Weekly progress submissions do not change
                  it automatically.
                </p>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">
                  Staff review notes
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reviewed by
                  </label>
                  <input
                    type="text"
                    value={reviewedBy}
                    disabled={updatingId === deliverable.id}
                    onChange={(e) => setReviewedBy(e.target.value)}
                    placeholder="Staff name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    disabled={updatingId === deliverable.id}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    placeholder="What did you review? Any feedback for the team?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60"
                  />
                </div>
                <button
                  type="button"
                  disabled={updatingId === deliverable.id}
                  onClick={() =>
                    onSaveStaffReview(deliverable, {
                      staffReviewNotes: reviewNotes.trim(),
                      reviewedBy: reviewedBy.trim(),
                      teamName,
                    })
                  }
                  className="w-full h-9 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  Save review comments
                </button>
                {tracker?.reviewedAt ? (
                  <p className="text-[11px] text-gray-500">
                    Last saved{" "}
                    {new Date(tracker.reviewedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {tracker.reviewedBy ? ` by ${tracker.reviewedBy}` : ""}
                  </p>
                ) : null}
              </div>

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
                    teamReviewStatus(deliverable, name),
                  );
                  const completedBy =
                    row?.deliverableStatus === "Completed" ||
                    row?.reviewStatus === "approved"
                      ? row?.reviewedBy
                      : null;
                  return (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {name}
                        </p>
                        {completedBy ? (
                          <p className="text-xs text-gray-500 truncate">
                            Marked complete by {completedBy}
                          </p>
                        ) : row?.staffReviewNotes ? (
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

          <DeliverableWeeklySubmissions
            deliverableId={deliverable.id}
            deliverableLabel={
              deliverable.label ||
              [
                deliverable.deliverableNumber,
                deliverable.deliverableName,
              ]
                .filter(Boolean)
                .join(" · ") ||
              deliverable.deliverableName
            }
            teamName={teamName}
          />

          {(deliverable.trackerRecords || []).length > 0 && isTeamReview ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Submission history
              </h3>
              <ul className="space-y-3">
                {(tracker ? [tracker] : deliverable.trackerRecords).map((t) => {
                  const statusLabel =
                    t.deliverableStatus ||
                    (t.reviewStatus === "approved"
                      ? "Completed"
                      : t.reviewStatus === "in_progress"
                        ? "In Progress, On Track"
                        : t.reviewStatus === "changes_requested"
                          ? "Behind"
                          : "Not Started");
                  const isComplete =
                    t.deliverableStatus === "Completed" ||
                    t.reviewStatus === "approved";
                  return (
                    <li
                      key={t.id}
                      className="rounded-lg border border-gray-200 p-3 text-sm"
                    >
                      <p className="font-medium text-gray-900">
                        {t.date || "Tracker update"} · {statusLabel}
                      </p>
                      {t.reviewedBy ? (
                        <p className="text-xs text-gray-600 mt-1">
                          {isComplete ? "Marked complete by" : "Reviewed by"}{" "}
                          <span className="font-medium text-gray-800">
                            {t.reviewedBy}
                          </span>
                          {t.reviewedAt
                            ? ` · ${new Date(t.reviewedAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}`
                            : ""}
                        </p>
                      ) : isComplete ? (
                        <p className="text-xs text-amber-700 mt-1">
                          Marked complete — reviewer name not recorded. Re-save
                          with &quot;Reviewed by&quot; filled in.
                        </p>
                      ) : null}
                      {t.staffReviewNotes ? (
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                          {t.staffReviewNotes}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
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
