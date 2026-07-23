export type BobProgramFormType =
  | "incident"
  | "wellness_check"
  | "blitz_points"
  | "anonymous_feedback";

export type BobStaffFormType =
  | "pto_request"
  | "purchase_request"
  | "reimbursement_request"
  | "photo_upload"
  | "coach_feedback";

export type BobFormType = BobProgramFormType | BobStaffFormType;

export interface BobFormDefinition {
  type: BobFormType;
  title: string;
  description: string;
  submitLabel: string;
  audience?: "program" | "staff";
}

export interface BobExternalFormLink {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export const BOB_PROGRAM_FORMS: BobFormDefinition[] = [
  {
    type: "incident",
    title: "Incident Report",
    description:
      "Report behavior, safety, or medical incidents. Select one or more students and note whether a parent was contacted.",
    submitLabel: "Submit incident",
    audience: "program",
  },
  {
    type: "wellness_check",
    title: "Weekly Check-in",
    description:
      "Ask the student how they are feeling this week (1–10) and record their score with a short explanation.",
    submitLabel: "Submit check-in",
    audience: "program",
  },
  {
    type: "blitz_points",
    title: "Blitz Points Award",
    description: "Award points to a Blitz team for games, socials, or coaching.",
    submitLabel: "Award points",
    audience: "program",
  },
  {
    type: "anonymous_feedback",
    title: "Feedback",
    description:
      "Share program or logistics feedback. Choose whether to submit anonymously.",
    submitLabel: "Submit feedback",
    audience: "program",
  },
];

export const BOB_STAFF_FORMS: BobFormDefinition[] = [
  {
    type: "pto_request",
    title: "Out of Office / PTO",
    description:
      "Request planned time away. Routed to program leadership and Support Squad.",
    submitLabel: "Submit PTO request",
    audience: "staff",
  },
  {
    type: "purchase_request",
    title: "Purchase Request",
    description:
      "Request approval for a program purchase. Include amount, vendor, and quote links if available.",
    submitLabel: "Submit purchase request",
    audience: "staff",
  },
  {
    type: "reimbursement_request",
    title: "Reimbursement",
    description:
      "Submit program-related expenses or mileage between two locations. Commuting to or from your normal work site is not reimbursable.",
    submitLabel: "Submit reimbursement",
    audience: "staff",
  },
  {
    type: "coach_feedback",
    title: "Weekly Coach Feedback",
    description:
      "Weekly survey: rate your week, share curriculum and logistics feedback, and ask leadership questions.",
    submitLabel: "Submit weekly coach feedback",
    audience: "staff",
  },
];

/** Program forms that live on dedicated pages (not /submit?type=). */
export const BOB_PROGRAM_FORM_LINKS: BobExternalFormLink[] = [
  {
    id: "dent_testimony",
    title: "Dent testimony",
    description:
      "Share a student or staff story in writing or via video link — available to staff and students.",
    href: "/app/bob/testimony",
    cta: "Open testimony form",
  },
];

export const BOB_STUDENT_FORM_LINKS: BobExternalFormLink[] = [
  {
    id: "attendance_correction",
    title: "Absence & Sign In/Out Correction",
    description:
      "Report absences you know are coming, or correct sign-in and sign-out times for days you attended.",
    href: "/app/bob/attendance/correction",
    cta: "Open correction form",
  },
  {
    id: "project_team",
    title: "Submit your project team",
    description:
      "Tell us who is on your BoB project team for this summer.",
    href: "https://airtable.com/appKnMenSN4RSG1ZV/paglydsT6YY4EKMiO/form",
    cta: "Open team form",
  },
  {
    id: "progress_update",
    title: "Weekly progress update",
    description:
      "Submit your team's deliverable progress, proof, and reflection for this week.",
    href: "/app/bob/progress-update",
    cta: "Open progress form",
  },
  {
    id: "anonymous_feedback",
    title: "Feedback",
    description:
      "Share program or logistics feedback. Choose whether to submit anonymously.",
    href: "/app/bob/submit?type=anonymous_feedback",
    cta: "Open feedback form",
  },
  {
    id: "reimbursement",
    title: "Reimbursement",
    description:
      "Submit program-related expenses or mileage between two locations. Commuting to or from home is not reimbursable.",
    href: "/app/bob/submit?type=reimbursement_request",
    cta: "Open reimbursement form",
  },
];

/** In-app submit types students may open directly (not staff-only requests). */
export const BOB_STUDENT_ALLOWED_FORM_TYPES: BobFormType[] = [
  "anonymous_feedback",
  "reimbursement_request",
];

export function isStudentAllowedSubmitType(type: BobFormType): boolean {
  return BOB_STUDENT_ALLOWED_FORM_TYPES.includes(type);
}

/** Official Airtable one-stop form (fallback when in-app link is unavailable). */
export const BOB_ATTENDANCE_CORRECTION_AIRTABLE_FORM =
  "https://airtable.com/appKnMenSN4RSG1ZV/pagkOVTlSpunIWWUZ/form";

/** @deprecated use BOB_PROGRAM_FORMS */
export const BOB_FORMS = [...BOB_PROGRAM_FORMS, ...BOB_STAFF_FORMS];

export function getBobFormDefinition(type: string): BobFormDefinition | null {
  return BOB_FORMS.find((f) => f.type === type) ?? null;
}

export function isBobFormType(value: string | null | undefined): value is BobFormType {
  return Boolean(value && getBobFormDefinition(value));
}
