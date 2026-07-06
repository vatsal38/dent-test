import type { BobSubmission, BobSubmissionType } from "@/platform/api/bob/submissions";
import { progressStatusLabel } from "@/features/bob/progress/progressConstants";
import { feedbackCategoryLabel } from "@/features/bob/submit/feedbackCategories";
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
    case "pto_request":
    case "purchase_request":
    case "reimbursement_request":
    case "photo_upload":
      return "bg-slate-50 text-slate-800 border-slate-200";
    case "coach_feedback":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "dent_testimony":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "attendance_correction":
      return "bg-sky-50 text-sky-800 border-sky-200";
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
  const lower = s.toLowerCase();
  if (lower === "low" || lower === "medium" || lower === "high") {
    return lower.toUpperCase();
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cardTitle(s: BobSubmission) {
  const student = s.student?.trim();
  const studentList =
    student ||
    (s.studentIds?.length ? `${s.studentIds.length} students` : "");
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
    const by =
      s.createdByLabel && !s.isAnonymous ? ` · ${s.createdByLabel}` : "";
    return studentList ? `${studentList} · ${kind}${by}` : `${kind}${by}`;
  }
  if (s.type === "wellness_check") {
    const score =
      s.wellnessScore != null ? `${s.wellnessScore}/10` : formatLabel(s.wellnessLevel);
    return student
      ? `${student} · Weekly check-in${score ? ` · ${score}` : ""}`
      : score
        ? `Weekly check-in · ${score}`
        : "Weekly check-in";
  }
  if (s.type === "blitz_points") {
    const cat = s.blitzCategory ? formatLabel(s.blitzCategory) : null;
    const teamPart = s.team ? ` · ${s.team}` : "";
    const catPart = cat ? ` · ${cat}` : "";
    return student
      ? `${student} · Blitz points${catPart}${teamPart}`
      : `Blitz points${catPart}${teamPart}` || "Blitz points";
  }
  if (s.type === "anonymous_feedback") {
    const prefix = s.isAnonymous ? "Anonymous feedback" : "Feedback";
    return s.category
      ? `${prefix} · ${feedbackCategoryLabel(s.category)}`
      : prefix;
  }
  if (s.type === "progress_update") {
    const focus =
      s.deliverableLabel || s.milestone
        ? ` · ${s.deliverableLabel || s.milestone}`
        : "";
    const status = s.deliverableStatus
      ? ` · ${progressStatusLabel(s.deliverableStatus)}`
      : "";
    const team = s.teamName ? ` (${s.teamName})` : "";
    return student
      ? `${student} · Progress update${focus}${status}${team}`
      : `Progress update${focus}${status}${team}`;
  }
  if (s.type === "parent_contact")
    return student
      ? `${student} · Parent contact`
      : s.parentName
        ? `Parent contact · ${s.parentName}`
        : "Parent contact";
  if (s.type === "pto_request") {
    const range =
      s.requestStartDate && s.requestEndDate
        ? ` · ${s.requestStartDate} – ${s.requestEndDate}`
        : "";
    const days =
      s.requestDayCount != null
        ? ` · ${s.requestDayCount} day${s.requestDayCount === 1 ? "" : "s"}`
        : "";
    const who = s.staffMemberName?.trim();
    return who ? `${who} · PTO request${range}${days}` : `PTO request${range}${days}`;
  }
  if (s.type === "purchase_request" || s.type === "reimbursement_request") {
    const amount =
      s.requestAmount != null
        ? ` · $${s.requestAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : "";
    const route =
      s.type === "reimbursement_request" && s.fromLocation && s.toLocation
        ? ` · ${s.fromLocation} → ${s.toLocation}`
        : "";
    const label = SUBMISSION_TYPE_LABELS[s.type] || s.type;
    return `${label}${amount}${route}`;
  }
  if (s.type === "photo_upload") {
    return "Photo album links";
  }
  if (s.type === "coach_feedback") {
    const rating = s.coachRating != null ? ` · ${s.coachRating}/5` : "";
    return `Weekly coach feedback${rating}`;
  }
  if (s.type === "dent_testimony") {
    const format =
      s.testimonyFormat === "video_link" ? " · Video" : " · Written";
    const who =
      s.testimonySubject === "staff"
        ? s.staffMemberName?.trim()
        : student;
    return who
      ? `${who} · Dent testimony${format}`
      : `Dent testimony${format}`;
  }
  if (s.type === "attendance_correction") {
    const kind = s.category || s.incidentType || "Request";
    const date =
      s.requestStartDate ? ` · ${s.requestStartDate}` : "";
    return student
      ? `${student} · ${kind}${date}`
      : `${kind}${date}`;
  }
  const base = SUBMISSION_TYPE_LABELS[s.type] || s.type;
  return student ? `${student} · ${base}` : base;
}

export function cardSummary(s: BobSubmission) {
  const parts: string[] = [];
  if (s.student) parts.push(s.student);
  if (s.parentContacted) parts.push(`parent contacted: ${s.parentContacted}`);
  if (s.deliverableStatus) parts.push(progressStatusLabel(s.deliverableStatus));
  if (s.teamName) parts.push(s.teamName);
  if (s.createdByLabel && !s.isAnonymous) parts.push(`by ${s.createdByLabel}`);
  if (s.severity) parts.push(`severity: ${s.severity}`);
  if (s.wellnessScore != null) parts.push(`score: ${s.wellnessScore}/10`);
  else if (s.wellnessLevel) parts.push(`wellness: ${s.wellnessLevel}`);
  if (s.priority) parts.push(`priority: ${s.priority}`);
  if (s.assignedToLabel) parts.push(s.assignedToLabel);
  if (s.points != null) parts.push(`${s.points} pts`);
  if (s.blitzCategory) parts.push(formatLabel(s.blitzCategory));
  if (s.blitzSource === "auto") parts.push("auto");
  if (s.blitzScope === "track" && s.blitzTrack) parts.push(s.blitzTrack);
  if (s.requestAmount != null) {
    parts.push(
      `$${s.requestAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    );
  }
  if (s.requestVendor) parts.push(s.requestVendor);
  if (s.requestStartDate && s.requestEndDate) {
    parts.push(`${s.requestStartDate} – ${s.requestEndDate}`);
  }
  if (s.requestDayCount != null) {
    parts.push(
      `${s.requestDayCount} program day${s.requestDayCount === 1 ? "" : "s"}`,
    );
  }
  if (s.category) parts.push(formatLabel(s.category));
  if (s.coachRating != null) parts.push(`rating: ${s.coachRating}/5`);
  if (s.publicConsent) parts.push("public consent");
  const body = (
    s.reflection ||
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
