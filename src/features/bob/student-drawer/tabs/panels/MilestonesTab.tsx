"use client";

import Link from "next/link";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentMilestones } from "../../hooks/useStudentTabQueries";
import { DetailCard, DetailCardGrid } from "../../widgets/DetailCard";
import { MilestonesTabSkeleton } from "../../widgets/TabPanelSkeleton";
import {
  isDeliverableCompleted,
  isDeliverableDue,
  isDeliverableOverdue,
  isDeliverableSubmitted,
  reviewStatusBadge,
} from "@/features/bob/milestones/deliverableDisplay";
import { hasIndustryCredential } from "../../lib/profileSignals";

function firstTrackLabel(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

export function MilestonesTab() {
  const { student, tab } = useStudentDrawerContext();
  const trackHint =
    firstTrackLabel(student?.track) ||
    firstTrackLabel(
      student?.airtableFields?.["Track - Site (from BoB '26 Track)"],
    ) ||
    firstTrackLabel(student?.airtableFields?.["BoB '25 Final Track"]) ||
    null;
  const { data: milestones = [], isLoading } = useStudentMilestones(
    student?.id ?? null,
    tab,
    trackHint,
  );

  if (!student) return null;
  if (isLoading) return <MilestonesTabSkeleton />;

  const stats = student.milestoneStats;
  const dueItems = milestones.filter((m) => isDeliverableDue(m));
  const overdueCount =
    stats?.overdue ??
    dueItems.filter((m) => isDeliverableOverdue(m)).length;
  const submittedCount =
    dueItems.filter((m) => isDeliverableSubmitted(m)).length;
  const completedCount =
    dueItems.filter((m) => isDeliverableCompleted(m)).length;

  return (
    <div className="p-5 space-y-5">
      <DetailCardGrid cols={2}>
        <DetailCard
          label="Due deliverables submitted"
          value={
            stats?.pctDueSubmitted != null
              ? `${stats.pctDueSubmitted}%`
              : dueItems.length
                ? `${Math.round((submittedCount / dueItems.length) * 100)}%`
                : "—"
          }
          hint={`${submittedCount} of ${dueItems.length || stats?.total || 0} due`}
        />
        <DetailCard
          label="Due deliverables completed"
          value={
            stats?.pctDueCompleted != null
              ? `${stats.pctDueCompleted}%`
              : dueItems.length
                ? `${Math.round((completedCount / dueItems.length) * 100)}%`
                : "—"
          }
          hint={`${completedCount} completed`}
        />
      </DetailCardGrid>

      <DetailCardGrid cols={3}>
        <DetailCard label="Overdue" value={overdueCount} />
        <DetailCard
          label="Submitted (due)"
          value={stats?.submitted ?? submittedCount}
        />
        <DetailCard
          label="Completed (due)"
          value={stats?.completed ?? completedCount}
        />
      </DetailCardGrid>

      {hasIndustryCredential(student) ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Industry-recognized credential on file
        </div>
      ) : null}

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Portfolio ({milestones.length})
        </h3>
        <Link
          href="/app/bob/deliverables"
          className="text-xs text-orange-600 font-medium"
        >
          Deliverables hub →
        </Link>
      </div>

      <ul className="space-y-2">
        {milestones.length === 0 ? (
          <li className="text-sm text-gray-500 py-8 text-center rounded-xl border border-dashed border-gray-200">
            No deliverables linked to this student yet.
          </li>
        ) : (
          milestones.map((m) => {
            const review = reviewStatusBadge(m.reviewStatus);
            const due = isDeliverableDue(m);
            const overdue = isDeliverableOverdue(m);
            const uploads = (m.trackerRecords || []).flatMap(
              (t) => t.uploads || [],
            );
            return (
              <li
                key={m.id}
                className="rounded-xl border border-gray-200 p-3 hover:border-orange-200 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {m.deliverableNumber ? `${m.deliverableNumber}: ` : ""}
                    {m.deliverableName}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${review.className}`}
                  >
                    {review.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.trackName || "—"}
                  {m.targetCompletionDate
                    ? ` · due ${m.targetCompletionDate}`
                    : ""}
                  {!due && m.targetCompletionDate ? " · not yet due" : ""}
                  {overdue ? " · overdue" : ""}
                </p>
                {uploads.length > 0 ? (
                  <ul className="mt-2 space-y-0.5">
                    {uploads.slice(0, 3).map((u) => (
                      <li key={u.id}>
                        <a
                          href={u.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-orange-600 hover:underline"
                        >
                          {u.filename} ↗
                        </a>
                      </li>
                    ))}
                    {uploads.length > 3 ? (
                      <li className="text-xs text-gray-400">
                        +{uploads.length - 3} more files
                      </li>
                    ) : null}
                  </ul>
                ) : null}
                {m.details ? (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {m.details}
                  </p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
