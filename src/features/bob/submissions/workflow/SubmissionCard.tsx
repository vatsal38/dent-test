"use client";

import type { BobSubmission } from "@/platform/api/bob/submissions";
import {
  badgeClassesForType,
  cardSummary,
  cardTitle,
  formatWhen,
  severityBadge,
} from "@/features/bob/submissions/display";
import {
  levelLabel,
  SUBMISSION_TYPE_LABELS,
} from "@/features/bob/submissions/workflow/constants";

export function SubmissionCard({
  submission,
  selected,
  bulkSelected,
  onOpen,
  onToggleBulk,
  draggable = true,
}: {
  submission: BobSubmission;
  selected: boolean;
  bulkSelected: boolean;
  onOpen: () => void;
  onToggleBulk: () => void;
  draggable?: boolean;
}) {
  const sevClass = severityBadge(submission.severity);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/submission-id", submission.id);
        e.dataTransfer.setData(
          "text/from-status",
          submission.status,
        );
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-lg border transition-colors ${
        selected
          ? "bg-orange-50 border-orange-300 ring-1 ring-orange-200"
          : bulkSelected
            ? "bg-blue-50 border-blue-200"
            : "bg-white border-gray-200 hover:border-orange-200"
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleBulk();
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 rounded border-gray-300 text-orange-600 shrink-0"
          aria-label="Select for bulk action"
        />
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left min-w-0"
        >
          <div className="flex justify-between gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${badgeClassesForType(submission.type)}`}
            >
              {SUBMISSION_TYPE_LABELS[submission.type]}
            </span>
            <span className="text-xs text-gray-400">
              {formatWhen(submission.lastTouchedAt || submission.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium line-clamp-1">
            {cardTitle(submission)}
          </p>
          {submission.createdByLabel && !submission.isAnonymous ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Submitted by {submission.createdByLabel}
            </p>
          ) : null}
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {cardSummary(submission) || "—"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {sevClass && submission.severity ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${sevClass}`}
              >
                {levelLabel(submission.severity)}
              </span>
            ) : null}
            {submission.priority ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600">
                {levelLabel(submission.priority)}
              </span>
            ) : null}
            {submission.secondaryAssignees?.length ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700">
                +{submission.secondaryAssignees.length} escalated
              </span>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
}
