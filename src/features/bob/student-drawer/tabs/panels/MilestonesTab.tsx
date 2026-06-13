"use client";

import Link from "next/link";
import { milestoneSummary } from "@/features/bob/roster/recordDisplay";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentMilestones } from "../../hooks/useStudentTabQueries";
import { DetailCard } from "../../widgets/DetailCard";
import { TabPanelSkeleton } from "../../widgets/TabPanelSkeleton";

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
  if (isLoading) return <TabPanelSkeleton rows={4} />;

  return (
    <div className="p-5 space-y-5">
      <DetailCard
        label="Portfolio summary"
        value={milestoneSummary(student)}
        hint="Program deliverables tied to this student"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Deliverable items ({milestones.length})
        </h3>
        <Link href="/app/bob/deliverables" className="text-xs text-orange-600 font-medium">
          Deliverables hub →
        </Link>
      </div>

      <ul className="space-y-2">
        {milestones.length === 0 ? (
          <li className="text-sm text-gray-500 py-8 text-center rounded-xl border border-dashed border-gray-200">
            No deliverables linked to this student yet.
          </li>
        ) : (
          milestones.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-gray-200 p-3 hover:border-orange-200 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900">
                {m.deliverableNumber ? `${m.deliverableNumber}: ` : ""}
                {m.deliverableName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {m.trackName || "—"} · {m.progressStatus || m.reviewStatus}
                {m.targetCompletionDate ? ` · due ${m.targetCompletionDate}` : ""}
              </p>
              {m.details ? (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{m.details}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
