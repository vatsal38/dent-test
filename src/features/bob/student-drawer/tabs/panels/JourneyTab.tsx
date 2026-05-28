"use client";

import { StatusBadge } from "@/components/bob/RecruitmentUi";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import { useStudentSubmissions } from "../../hooks/useStudentTabQueries";
import { useBobStudentOnboardingTasks } from "@/platform/query/hooks/useBobStudentOnboarding";
import { ActivityTimeline } from "../../widgets/ActivityTimeline";
import type { ActivityTimelineItem } from "../../types";
import { useBobRosterSchema } from "@/platform/query/hooks/useBobStudents";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import {
  cellDisplayValue,
  extractAirtableRecordIds,
} from "@/lib/bobAirtableDisplay";

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  not_placed: "Not placed",
};

export function JourneyTab() {
  const { student, tab } = useStudentDrawerContext();
  const { data: submissions = [] } = useStudentSubmissions(
    student?.id ?? null,
    tab,
  );
  const { data: onboarding } = useBobStudentOnboardingTasks(student?.id ?? null, {
    enabled: tab === "journey",
  });
  const { data: schemaRes } = useBobRosterSchema();
  const schema = schemaRes?.fields ?? null;
  const linkedNames = schema
    ? schema
        .filter((f) => f?.type === "multipleRecordLinks" && f?.name)
        .map((f) => f.name)
    : [];

  const fieldName = (patterns: RegExp[], fallback?: string) => {
    const hit = linkedNames.find((n) => patterns.some((p) => p.test(n)));
    return hit || fallback || "";
  };

  const trackField = fieldName([/^track$/i, /program\s*track/i, /\btrack\b/i], "Track");
  const ywField = fieldName([/^yw\s*status$/i, /youth\s*works\s*status/i], "YW Status");

  const { labelsForField, resolving } = useBobLinkedFieldLabels(
    schema,
    student ? [student] : [],
    Array.from(new Set([trackField, ywField].filter(Boolean))),
  );

  if (!student) return null;

  const fields = (student.airtableFields || {}) as Record<string, unknown>;
  const ywRaw =
    student.ywStatus ||
    (fields[ywField] != null ? fields[ywField] : null) ||
    (fields["Youth Works Status"] != null ? fields["Youth Works Status"] : null);
  const yw = ywRaw
    ? cellDisplayValue(
        ywRaw,
        labelsForField(ywField),
      )
    : "";
  const ywLabel = yw && yw !== "—" && yw !== "…" ? yw : "";
  const stageLabel =
    (student.interviewStage
      ? STAGE_LABELS[student.interviewStage] || student.interviewStage
      : null) || "—";
  const enrollmentLabel = student.status ? String(student.status) : "—";
  const trackValue = fields[trackField] ?? student.track;
  const trackMap = labelsForField(trackField);
  const trackIds = extractAirtableRecordIds(trackValue);
  const hasUnresolvedTrack = trackIds.some((id) => !trackMap[id]);
  const trackResolved =
    trackIds.length > 0 && hasUnresolvedTrack && resolving
      ? "Loading…"
      : cellDisplayValue(trackValue, trackMap);
  const trackLabel =
    trackResolved && trackResolved !== "—" && trackResolved !== "…" ? trackResolved : "";

  const journeyItems: ActivityTimelineItem[] = [
    {
      id: "stage-interview",
      at: student.createdAt,
      kind: "status",
      title: `Interview stage: ${stageLabel}`,
      tone: "info",
    },
    {
      id: "status-enrollment",
      at: student.updatedAt,
      kind: "status",
      title: `Enrollment: ${enrollmentLabel}`,
      subtitle: ywLabel || undefined,
      tone: student.status === "active" ? "success" : "neutral",
    },
  ];

  if (onboarding?.tasks?.length) {
    const done = onboarding.tasks.filter((t) => t.status === "done").length;
    journeyItems.unshift({
      id: "onboarding-progress",
      at: onboarding.tasks[0]?.createdAt || student.createdAt,
      kind: "onboarding",
      title: `Onboarding ${done}/${onboarding.tasks.length} complete`,
      tone: done === onboarding.tasks.length ? "success" : "warning",
    });
  }

  const milestoneSubmission = submissions.find((s) => s.milestone);
  if (milestoneSubmission?.milestone) {
    journeyItems.push({
      id: "last-milestone-sub",
      at: milestoneSubmission.createdAt,
      kind: "milestone",
      title: `Milestone update: ${milestoneSubmission.milestone}`,
      tone: "success",
    });
  }

  journeyItems.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <div className="p-5 space-y-6">
      <section className="rounded-xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Pipeline position
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={stageLabel}
            variant="airtable"
          />
          {ywLabel ? <StatusBadge label={ywLabel} variant="app" /> : null}
          {trackLabel ? <StatusBadge label={trackLabel} variant="app" /> : null}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Journey timeline
        </h3>
        <ActivityTimeline items={journeyItems} />
      </section>
    </div>
  );
}
