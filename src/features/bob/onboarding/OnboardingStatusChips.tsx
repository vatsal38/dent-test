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

export function OnboardingStatusChips({
  status,
  compact = false,
}: {
  status?: BobOnboardingStatus | null;
  compact?: boolean;
}) {
  if (!status) {
    return (
      <span className="text-xs text-gray-400">—</span>
    );
  }

  const contractPhase =
    status.contract.phase === "signed"
      ? "signed"
      : status.contract.phase === "in_progress"
        ? "in_progress"
        : status.contract.phase === "not_started"
          ? "not_started"
          : "unknown";

  const ywPhase = status.ywReady
    ? "complete"
    : status.ywRegistration.phase === "incomplete"
      ? "incomplete"
      : "unknown";

  const surveyPhase = status.preSurveyComplete
    ? "complete"
    : status.preSurvey.phase === "incomplete"
      ? "incomplete"
      : status.preSurvey.synced
        ? "incomplete"
        : "unknown";

  const items = [
    chip(
      "contract",
      compact
        ? contractPhase === "signed"
          ? "Contract ✓"
          : "Contract"
        : `Contract: ${contractPhase === "signed" ? "Signed" : contractPhase === "in_progress" ? "Pending" : "—"}`,
      contractPhase === "signed" ? "signed" : contractPhase === "in_progress" ? "in_progress" : "not_started",
    ),
    chip(
      "yw",
      compact ? (status.ywReady ? "YW ✓" : "YW") : `YW: ${status.ywReady ? "Ready" : "Pending"}`,
      ywPhase,
    ),
    chip(
      "survey",
      compact
        ? status.preSurveyComplete
          ? "Survey ✓"
          : "Survey"
        : `Survey: ${status.preSurveyComplete ? "Done" : status.preSurvey.synced ? "Pending" : "—"}`,
      surveyPhase,
    ),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items}
      {status.readyForProgram ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
          Ready
        </span>
      ) : null}
    </div>
  );
}
