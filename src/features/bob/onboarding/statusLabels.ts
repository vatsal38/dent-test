import type { BobOnboardingStatus } from "@/platform/api/bob/students";

export function contractStatusLabel(
  phase: BobOnboardingStatus["contract"]["phase"] | "not_needed",
): string {
  switch (phase) {
    case "signed":
      return "Signed";
    case "not_needed":
      return "Not needed";
    case "in_progress":
      return "In progress";
    case "not_started":
      return "Not started";
    default:
      return "Unknown";
  }
}

export function ywRegistrationLabel(
  status: BobOnboardingStatus["ywRegistration"],
): string {
  if (status.presentInYwFinal) return "In YW Final";
  if (status.label) return status.label;
  switch (status.phase) {
    case "complete":
      return "Complete";
    case "incomplete":
      return "Incomplete";
    default:
      return "—";
  }
}

export function preSurveyLabel(status: BobOnboardingStatus["preSurvey"]): string {
  if (!status.synced) return "Not synced from Airtable";
  if (status.label) return status.label;
  switch (status.phase) {
    case "complete":
      return "Completed";
    case "incomplete":
      return "Still need to complete";
    default:
      return "—";
  }
}

export function onboardingPhaseTone(
  phase:
    | "signed"
    | "complete"
    | "in_progress"
    | "incomplete"
    | "not_started"
    | "not_needed"
    | "unknown",
): string {
  if (phase === "signed" || phase === "complete" || phase === "not_needed") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (phase === "in_progress" || phase === "incomplete") {
    return "bg-amber-50 text-amber-900 border-amber-200";
  }
  if (phase === "not_started") {
    return "bg-gray-50 text-gray-700 border-gray-200";
  }
  return "bg-gray-50 text-gray-500 border-gray-200";
}
