"use client";

import type { BobDeliverable } from "@/platform/api/bob/milestones";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import {
  DELIVERABLE_SLOTS,
  deliverableSlotLabel,
  type DeliverableSlotMap,
} from "../deliverableGrouping";
import {
  formatDeliverableDates,
  reviewStatusBadge,
} from "../deliverableDisplay";
import {
  findTrackerForTeam,
  teamPendingUploadCount,
  teamReviewStatus,
} from "../deliverableTeamReview";

function DeliverableSlotCard({
  deliverable,
  teamName,
  variant,
  onSelect,
}: {
  deliverable: BobDeliverable | undefined;
  teamName?: string;
  variant: "catalog" | "team";
  onSelect: (d: BobDeliverable, teamName?: string) => void;
}) {
  if (!deliverable) {
    return (
      <div className="h-full min-h-[96px] rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 flex items-center justify-center">
        <span className="text-xs text-gray-400">—</span>
      </div>
    );
  }

  const isTeam = variant === "team";
  const reviewStatus = isTeam
    ? teamReviewStatus(deliverable, teamName)
    : teamReviewStatus(deliverable);
  const review = reviewStatusBadge(reviewStatus);
  const uploads = isTeam
    ? teamPendingUploadCount(deliverable, teamName)
    : 0;
  const tracker = isTeam ? findTrackerForTeam(deliverable, teamName) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(deliverable, teamName)}
      className="h-full min-h-[96px] w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-orange-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold text-orange-700 truncate">
          {deliverable.deliverableNumber || "Deliverable"}
        </p>
        {deliverable.milestoneComplete ? (
          <span className="shrink-0 text-green-600 text-sm" title="Complete">
            ✓
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mt-0.5">
        {deliverable.deliverableName}
      </p>
      <p className="text-[10px] text-gray-500 mt-1 truncate">
        {formatDeliverableDates(deliverable)}
      </p>
      <div className="flex flex-wrap gap-1 mt-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${review.className}`}>
          {review.label}
        </span>
        {isTeam && tracker?.staffReviewNotes ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
            Staff notes
          </span>
        ) : null}
        {uploads > 0 ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
            {uploads} upload{uploads === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      {!isTeam ? (
        <p className="text-[10px] text-gray-400 mt-1">Review per team →</p>
      ) : null}
    </button>
  );
}

function MatrixRow({
  label,
  sublabel,
  slots,
  teamName,
  variant,
  onSelect,
}: {
  label: string;
  sublabel?: string;
  slots: DeliverableSlotMap;
  teamName?: string;
  variant: "catalog" | "team";
  onSelect: (d: BobDeliverable, teamName?: string) => void;
}) {
  return (
    <tr className="align-top">
      <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-gray-100 min-w-[140px] max-w-[200px]">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
        {sublabel ? (
          <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
        ) : null}
      </td>
      {DELIVERABLE_SLOTS.map((slot) => (
        <td key={slot} className="px-2 py-3 w-[22%]">
          <DeliverableSlotCard
            deliverable={slots.get(slot)}
            teamName={teamName}
            variant={variant}
            onSelect={onSelect}
          />
        </td>
      ))}
    </tr>
  );
}

export function DeliverablesTrackMatrix({
  rows,
  onSelect,
}: {
  rows: Array<{ trackName: string; slots: DeliverableSlotMap }>;
  onSelect: (d: BobDeliverable) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Track catalog — shows program progress by track. Staff review happens
        per project team in the{" "}
        <span className="font-medium text-gray-800">By Team</span> tab.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 font-medium sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                Track
              </th>
              {DELIVERABLE_SLOTS.map((slot) => (
                <th key={slot} className="px-2 py-2.5 font-medium text-center">
                  {deliverableSlotLabel(slot)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <MatrixRow
                key={row.trackName}
                label={formatBobTrackDisplayLabel(row.trackName)}
                slots={row.slots}
                variant="catalog"
                onSelect={(d) => onSelect(d)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeliverablesTeamMatrix({
  rows,
  onSelect,
}: {
  rows: Array<{ teamName: string; slots: DeliverableSlotMap }>;
  onSelect: (d: BobDeliverable, teamName: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Each cell is a team&apos;s tracker row with staff review status and
        uploads. Open a deliverable to update review status and staff notes.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 font-medium sticky left-0 bg-gray-50 z-10 border-r border-gray-100">
                Project team
              </th>
              {DELIVERABLE_SLOTS.map((slot) => (
                <th key={slot} className="px-2 py-2.5 font-medium text-center">
                  {deliverableSlotLabel(slot)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <MatrixRow
                key={row.teamName}
                label={row.teamName}
                sublabel={
                  row.slots.size
                    ? `${row.slots.size} deliverable${row.slots.size === 1 ? "" : "s"}`
                    : undefined
                }
                teamName={row.teamName}
                slots={row.slots}
                variant="team"
                onSelect={(d, team) => onSelect(d, team || row.teamName)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Each youth submits a weekly progress update for their team deliverable.
        Open a cell to see all submissions for that team (typically one per
        member). Staff review status below is updated after coach review.
      </p>
    </div>
  );
}
