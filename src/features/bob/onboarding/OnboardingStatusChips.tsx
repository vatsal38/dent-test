"use client";

import type { BobOnboardingStatus } from "@/platform/api/bob/students";
import { onboardingPhaseTone } from "@/features/bob/onboarding/statusLabels";

function chip(
  key: string,
  label: string,
  phase: Parameters<typeof onboardingPhaseTone>[0],
) {
  return (
    <span
      key={key}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight ${onboardingPhaseTone(phase)}`}
      title={label}
    >
      {label}
    </span>
  );
}

function parentTone(
  phase: NonNullable<BobOnboardingStatus["parentContract"]>["phase"],
): Parameters<typeof onboardingPhaseTone>[0] {
  if (phase === "signed" || phase === "not_needed") return phase;
  if (phase === "in_progress") return "in_progress";
  if (phase === "not_started") return "not_started";
  return "unknown";
}

export function OnboardingStatusChips({
  status,
  compact = false,
}: {
  status?: BobOnboardingStatus | null;
  compact?: boolean;
}) {
  if (!status) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const parent = status.parentContract;
  const youth = status.youthContract;
  const ready =
    status.contractAndPreSurveyComplete ?? status.readyForProgram;

  const parentLabel = compact
    ? parent?.satisfied
      ? "Parent ✓"
      : "Parent"
    : `Parent/Guardian: ${
        parent?.label ||
        (parent?.phase === "signed"
          ? "Signed"
          : parent?.phase === "not_needed"
            ? "18+ N/A"
            : parent?.phase === "in_progress"
              ? "Pending"
              : "—")
      }`;

  const youthLabel = compact
    ? youth?.signed || youth?.phase === "signed"
      ? "Youth ✓"
      : "Youth"
    : `Youth: ${
        youth?.label ||
        (youth?.phase === "signed"
          ? "Signed"
          : youth?.phase === "in_progress"
            ? "Pending"
            : "—")
      }`;

  const surveyLabel = compact
    ? status.preSurveyComplete
      ? "Survey ✓"
      : "Survey"
    : `Pre-survey: ${
        status.preSurvey.label ||
        (status.preSurveyComplete
          ? "Completed"
          : status.preSurvey.synced
            ? "Pending"
            : "—")
      }`;

  // Always show all three statuses (38B).
  const items = [
    chip("youth", youthLabel, youth ? (youth.phase === "signed"
      ? "signed"
      : youth.phase === "in_progress"
        ? "in_progress"
        : youth.phase === "not_started"
          ? "not_started"
          : "unknown") : "unknown"),
    chip(
      "parent",
      parent
        ? parentLabel
        : compact
          ? status.contractSigned
            ? "Parent ✓"
            : "Parent"
          : `Parent/Guardian: ${
              status.contract.phase === "signed"
                ? "Signed"
                : status.contract.phase === "in_progress"
                  ? "Pending"
                  : "—"
            }`,
      parent
        ? parentTone(parent.phase)
        : status.contract.phase === "signed"
          ? "signed"
          : status.contract.phase === "in_progress"
            ? "in_progress"
            : "not_started",
    ),
    chip(
      "survey",
      surveyLabel,
      status.preSurveyComplete
        ? "complete"
        : status.preSurvey.phase === "incomplete"
          ? "incomplete"
          : status.preSurvey.synced
            ? "incomplete"
            : "unknown",
    ),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items}
      {ready ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
          Ready
        </span>
      ) : null}
    </div>
  );
}
