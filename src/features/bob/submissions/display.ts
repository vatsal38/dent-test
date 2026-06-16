import type { BobSubmission, BobSubmissionType } from "@/platform/api/bob/submissions";
import {
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/features/bob/submissions/workflow/constants";

export { SUBMISSION_STATUS_LABELS, SUBMISSION_TYPE_LABELS };

export function badgeClassesForType(type: BobSubmissionType) {
  switch (type) {
    case "incident":
      return "bg-red-50 text-red-700 border-red-200";
    case "wellness_check":
      return "bg-rose-50 text-rose-800 border-rose-200";
    case "parent_contact":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "progress_update":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "anonymous_feedback":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "blitz_points":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function severityBadge(severity: string | null | undefined) {
  if (!severity) return null;
  const s = severity.toLowerCase();
  if (s === "high")
    return "bg-red-100 text-red-800 border-red-200";
  if (s === "medium")
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLabel(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cardTitle(s: BobSubmission) {
  const student = s.student?.trim();
  if (s.type === "incident") {
    const raw = s.incidentType?.trim().toLowerCase();
    const kind =
      raw === "behavior"
        ? "Behavior incident"
        : raw === "safety"
          ? "Safety incident"
          : raw === "medical"
            ? "Medical incident"
            : raw === "parent_contact"
              ? "Parent contact incident"
              : formatLabel(s.incidentType) || "Incident";
    return student ? `${student} · ${kind}` : kind;
  }
  if (s.type === "wellness_check") {
    const level = formatLabel(s.wellnessLevel);
    return student
      ? `${student} · Wellness${level ? ` · ${level}` : ""}`
      : level
        ? `Wellness · ${level}`
        : "Wellness check";
  }
  if (s.type === "blitz_points") {
    return student
      ? `${student} · Blitz points${s.team ? ` · ${s.team}` : ""}`
      : s.team
        ? `Blitz points · ${s.team}`
        : "Blitz points";
  }
  if (s.type === "anonymous_feedback")
    return s.category ? `Feedback · ${formatLabel(s.category)}` : "Anonymous feedback";
  if (s.type === "progress_update")
    return student
      ? `${student} · Progress update`
      : s.milestone
        ? `Progress · ${s.milestone}`
        : "Progress update";
  if (s.type === "parent_contact")
    return student
      ? `${student} · Parent contact`
      : s.parentName
        ? `Parent contact · ${s.parentName}`
        : "Parent contact";
  const base = SUBMISSION_TYPE_LABELS[s.type] || s.type;
  return student ? `${student} · ${base}` : base;
}

export function cardSummary(s: BobSubmission) {
  const parts: string[] = [];
  if (s.student) parts.push(s.student);
  if (s.severity) parts.push(`severity: ${s.severity}`);
  if (s.wellnessLevel) parts.push(`wellness: ${s.wellnessLevel}`);
  if (s.priority) parts.push(`priority: ${s.priority}`);
  if (s.assignedToLabel) parts.push(s.assignedToLabel);
  if (s.points != null) parts.push(`${s.points} pts`);
  const body = (
    s.description ||
    s.concernSummary ||
    s.feedback ||
    s.notes ||
    s.reason ||
    ""
  ).trim();
  if (body) parts.push(body.length > 80 ? `${body.slice(0, 80)}…` : body);
  return parts.join(" · ");
}

export function eventTypeLabel(type: string) {
  switch (type) {
    case "status_change":
      return "Status change";
    case "assignment":
      return "Assignment";
    case "routing":
      return "Routing";
    case "notification":
      return "Notification";
    case "attachment":
      return "Attachment";
    case "comment":
      return "Comment";
    case "created":
      return "Created";
    case "updated":
      return "Updated";
    default:
      return "Update";
  }
}

export function resolveActorLabel(
  actorId: string | null | undefined,
  staff: Array<{ id: string; name?: string | null; email?: string | null }>,
): string {
  if (!actorId) return "System";
  const person = staff.find((s) => s.id === actorId);
  if (person?.name?.trim()) return person.name.trim();
  if (person?.email?.trim()) return person.email.trim();
  return "Staff";
}

export function formatEventSummary(
  type: string,
  content: string | null | undefined,
  meta?: Record<string, unknown> | null,
): string | null {
  if (content?.trim()) return content.trim();
  if (type === "status_change" && meta) {
    const from = meta.from != null ? String(meta.from) : "—";
    const to = meta.to != null ? String(meta.to) : "—";
    const source = meta.source ? ` (${String(meta.source)})` : "";
    return `${from} → ${to}${source}`;
  }
  if (type === "assignment" && meta?.assignedTo) {
    return `Assigned to ${String(meta.assignedTo)}`;
  }
  if (type === "routing" && meta?.routingReason) {
    return String(meta.routingReason).replace(/_/g, " ");
  }
  if (type === "attachment" && meta?.filename) {
    return `Added ${String(meta.filename)}`;
  }
  return null;
}
