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
import { useStudentLinkedFieldDisplay } from "../../hooks/useStudentLinkedFieldDisplay";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { canEditStudentRecord } from "@/platform/rbac/studentProfile";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { isOwnStudentProfile } from "@/platform/rbac/studentProfile";

function attendancePercent(student: {
  attendanceStats?: {
    hoursPct?: number;
    present?: number;
    absent?: number;
  } | null;
}): string {
  const a = student.attendanceStats;
  if (!a) return "—";
  if (typeof a.hoursPct === "number") return `${a.hoursPct}%`;
  const present = a.present ?? 0;
  const absent = a.absent ?? 0;
  const total = present + absent;
  if (!total) return "—";
  return `${Math.round((present / total) * 100)}%`;
}

function deliverablePercent(student: {
  milestoneStats?: {
    pctDueSubmitted?: number;
    submitted?: number;
    total?: number;
  } | null;
}): string {
  const m = student.milestoneStats;
  if (!m) return "—";
  if (typeof m.pctDueSubmitted === "number" && m.total) {
    return `${m.pctDueSubmitted}%`;
  }
  if (!m.total) return "—";
  const submitted = m.submitted ?? 0;
  return `${Math.round((submitted / m.total) * 100)}%`;
}

export function OverviewTab() {
  const { student, tab, setTab } = useStudentDrawerContext();
  const { can, access } = useBobAccess();
  const { data: me } = useBobMe();
  const allowEdit = canEditStudentRecord(can, me?.linkedStudent?.id, student?.id);
  const viewingSelf = isOwnStudentProfile(access, me?.linkedStudent?.id, student?.id);
  const isStudentViewer = access.role === "student";
  const showPersonalDetails = !isStudentViewer || viewingSelf;
  const { items, isLoading } = useStudentActivityFeed(student, tab, student?.podId);
  const { fields, school, track } = useStudentLinkedFieldDisplay(student);

  if (!student) return null;

  const notes = extractCoachNotes(student).slice(0, 2);
  const pronouns = String(fields.Pronouns ?? fields.pronouns ?? "").trim();
  const rows = studentSummaryRows(student)
    .filter((r) => r.label !== "Coach" && r.label !== "Track")
    .map((r) => {
      if (r.label === "School") return { ...r, value: school };
      return r;
    });
  if (pronouns) {
    rows.unshift({ label: "Pronouns", value: pronouns });
  }
  if (track && track !== "—") {
    rows.push({ label: "Track", value: track });
  }
  const blitzTeam =
    student.blitzSquad?.trim() ||
    student.blitzColor?.trim() ||
    "";
  if (blitzTeam) {
    rows.push({ label: "Blitz team", value: blitzTeam });
  }
  for (const key of ["Project", "Team", "Program Team"]) {
    const raw = fields[key];
    const val = raw != null ? String(raw).trim() : "";
    if (val) rows.push({ label: key, value: val });
  }

  return (
    <div className="p-5 space-y-6">
      {showPersonalDetails ? (
        <DetailCardGrid>
          <DetailCard
            label="Attendance"
            value={attendancePercent(student)}
            hint={
              student.attendanceStats?.hoursAttended != null
                ? `${student.attendanceStats.hoursAttended}h of ${student.attendanceStats.hoursPotential ?? "—"}h · ${student.attendanceStats?.absent ?? 0} absences`
                : `${student.attendanceStats?.absent ?? 0} absences`
            }
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
            value={deliverablePercent(student)}
            hint={
              student.milestoneStats?.total
                ? `${student.milestoneStats.completed ?? student.milestoneStats.submitted ?? 0} of ${student.milestoneStats.total} due · ${student.milestoneStats.overdue ?? 0} overdue`
                : "No due deliverables yet"
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
        </DetailCardGrid>
      ) : null}

      {showPersonalDetails ? (
        <section className="flex flex-wrap gap-2">
          <Link
            href={`/app/bob/progress-update?studentId=${encodeURIComponent(student.id)}`}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
          >
            Weekly progress update
          </Link>
          <Link
            href={`/app/bob/testimony?studentId=${encodeURIComponent(student.id)}`}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100"
          >
            Dent testimony
          </Link>
        </section>
      ) : null}

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {showPersonalDetails ? "Contact & program" : "Program"}
        </h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows
            .filter((row) =>
              showPersonalDetails
                ? true
                : row.label === "Track" ||
                  row.label === "Blitz team" ||
                  row.label === "Team" ||
                  row.label === "Project" ||
                  row.label === "Program Team",
            )
            .map((row) => (
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

      {can("notes.viewStaff") && notes.length > 0 ? (
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

      {access.role !== "student" ? (
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
      ) : null}

      {allowEdit ? (
        <p className="text-xs text-gray-500">
          Need to edit fields?{" "}
          <Link
            href={`/app/bob/roster/${student.id}?edit=1`}
            className="text-orange-600 font-medium"
          >
            Open full record editor
          </Link>
        </p>
      ) : null}
    </div>
  );
}
