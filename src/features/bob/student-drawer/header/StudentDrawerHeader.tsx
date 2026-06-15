"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/bob/RecruitmentUi";
import { StudentHeadshot } from "./StudentHeadshot";
import {
  attendanceSummary,
  milestoneSummary,
  studentDisplayName,
} from "@/features/bob/roster/recordDisplay";
import { RatingBar } from "../widgets/RatingBar";
import { WellnessStrip } from "../widgets/WellnessIndicator";
import { useStudentDrawerContext } from "../context/StudentDrawerContext";
import {
  computeEngagementRating,
  computeWellnessSignals,
  hasIndustryCredential,
} from "../lib/profileSignals";
import { useStudentSubmissions } from "../hooks/useStudentTabQueries";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  not_placed: "Not placed",
};

export function StudentDrawerHeader() {
  const { student, onClose, tab, setTab } = useStudentDrawerContext();
  const { data: submissions = [] } = useStudentSubmissions(
    student?.id ?? null,
    tab,
  );

  if (!student) return null;

  const name = studentDisplayName(student);
  const wellness = computeWellnessSignals(student, submissions);
  const rating = computeEngagementRating(student, submissions);
  const statusLabel = student.status
    ? STATUS_LABELS[student.status] || student.status
    : null;
  const stageLabel = student.interviewStage
    ? STAGE_LABELS[student.interviewStage] || student.interviewStage
    : null;
  const industryCredential = hasIndustryCredential(student);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="px-5 pt-4 pb-3">
        <div className="flex gap-3">
          <StudentHeadshot student={student} name={name} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
              Student command center
            </p>
            <h2 className="text-xl font-bold text-gray-900 truncate">{name}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {statusLabel ? (
                <StatusBadge label={statusLabel} variant="app" />
              ) : null}
              {stageLabel ? (
                <StatusBadge label={stageLabel} variant="airtable" />
              ) : null}
              {industryCredential ? (
                <StatusBadge label="Industry credential" variant="app" />
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center"
            aria-label="Close student profile"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <RatingBar score={rating.score} label={rating.label} />
          <span className="text-xs text-gray-400 hidden sm:inline">·</span>
          <span className="text-xs text-gray-600">
            {attendanceSummary(student)}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-600">
            {milestoneSummary(student)}
          </span>
        </div>
      </div>

      <div className="px-5 pb-3">
        <WellnessStrip signals={wellness} />
      </div>

      <div className="px-5 pb-3 flex flex-wrap gap-2">
        <Link
          href={`/app/bob/attendance/mark?pod=${encodeURIComponent(student.podId || "")}${student.track ? `&track=${encodeURIComponent(student.track)}` : ""}`}
          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          Update attendance
        </Link>
        <Link
          href={`/app/bob/submit?studentId=${encodeURIComponent(student.id)}`}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
        >
          Log incident
        </Link>
        <button
          type="button"
          onClick={() => setTab("notes")}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
        >
          Coach notes
        </button>
        <Link
          href={`/app/bob/roster/${student.id}`}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 ml-auto"
        >
          Full record →
        </Link>
      </div>
    </header>
  );
}
