"use client";

import Link from "next/link";
import {
  studentSummaryRows,
} from "@/features/bob/roster/recordDisplay";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { DetailCard, DetailCardGrid } from "../../widgets/DetailCard";
import { CoachNoteCard } from "../../widgets/CoachNoteCard";
import { ActivityTimeline } from "../../widgets/ActivityTimeline";
import { extractCoachNotes } from "../../lib/profileSignals";
import { useStudentActivityFeed } from "../../hooks/useStudentTabQueries";
import {
  extractAirtableRecordIds,
  isAirtableRecordId,
} from "@/lib/bobAirtableDisplay";
import { useStudentLinkedFieldDisplay } from "../../hooks/useStudentLinkedFieldDisplay";

export function OverviewTab() {
  const { student, tab, setTab } = useStudentDrawerContext();
  const { items, isLoading } = useStudentActivityFeed(
    student?.id ?? null,
    tab,
    student?.podId,
  );
  const { coachField, fields, resolving, school, track, coach } =
    useStudentLinkedFieldDisplay(student);

  if (!student) return null;

  const notes = extractCoachNotes(student).slice(0, 2);
  const rows = studentSummaryRows(student).map((r) => {
    if (r.label === "School") return { ...r, value: school };
    if (r.label === "Track") return { ...r, value: track };
    if (r.label === "Coach") return { ...r, value: coach };
    return r;
  });

  return (
    <div className="p-5 space-y-6">
      <DetailCardGrid>
        <DetailCard
          label="Attendance"
          value={student.attendanceStats?.present ?? 0}
          hint={`${student.attendanceStats?.absent ?? 0} absences`}
          action={
            <button
              type="button"
              onClick={() => setTab("attendance")}
              className="text-[11px] font-medium text-orange-600"
            >
              View
            </button>
          }
        />
        <DetailCard
          label="Deliverables"
          value={
            student.milestoneStats?.total
              ? `${student.milestoneStats?.submitted ?? 0}/${student.milestoneStats.total}`
              : "—"
          }
          action={
            <button
              type="button"
              onClick={() => setTab("milestones")}
              className="text-[11px] font-medium text-orange-600"
            >
              View
            </button>
          }
        />
        <DetailCard
          label="Coach"
          value={
            coach && coach !== "—"
              ? coach
              : isAirtableRecordId(String(student.coach || "")) || extractAirtableRecordIds(fields[coachField]).length
                ? "Loading…"
                : "Unassigned"
          }
        />
        <DetailCard label="Track" value={track || "—"} />
      </DetailCardGrid>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Contact & program
        </h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <dt className="text-[11px] text-gray-500">{row.label}</dt>
              <dd className="text-sm font-medium text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {notes.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Latest coach notes
            </h3>
            <button
              type="button"
              onClick={() => setTab("notes")}
              className="text-xs text-orange-600 font-medium"
            >
              All notes
            </button>
          </div>
          <div className="space-y-2">
            {notes.map((n) => (
              <CoachNoteCard key={n.id} note={n} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent activity
          </h3>
          <button
            type="button"
            onClick={() => setTab("activity")}
            className="text-xs text-orange-600 font-medium"
          >
            Full timeline
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading activity…</p>
        ) : (
          <ActivityTimeline items={items.slice(0, 6)} />
        )}
      </section>

      <p className="text-xs text-gray-500">
        Need to edit fields?{" "}
        <Link
          href={`/app/bob/roster/${student.id}?edit=1`}
          className="text-orange-600 font-medium"
        >
          Open full record editor
        </Link>
      </p>
    </div>
  );
}
