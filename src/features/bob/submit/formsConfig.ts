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
      "Submit an expense for reimbursement. Attach receipts or receipt links.",
    submitLabel: "Submit reimbursement",
    audience: "staff",
  },
  {
    type: "photo_upload",
    title: "Photo Album Links",
    description:
      "Share Google Photos or Drive album links from a session or event.",
    submitLabel: "Submit album links",
    audience: "staff",
  },
  {
    type: "coach_feedback",
    title: "Coach Feedback",
    description:
      "Weekly survey: rate your week, share curriculum and logistics feedback, and ask leadership questions.",
    submitLabel: "Submit coach feedback",
    audience: "staff",
  },
];

export const BOB_STUDENT_FORM_LINKS: BobExternalFormLink[] = [
  {
    id: "attendance_correction",
    title: "Report absence / fix sign-in times",
    description:
      "Request approval for a planned absence or correct sign-in or sign-out times.",
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
    id: "dent_testimony",
    title: "Dent testimony",
    description:
      "Share a written story or video link with consent for public program use.",
    href: "/app/bob/testimony",
    cta: "Open testimony form",
  },
  {
    id: "anonymous_feedback",
    title: "Feedback",
    description:
      "Share program or logistics feedback. Choose whether to submit anonymously.",
    href: "/app/bob/submit?type=anonymous_feedback",
    cta: "Open feedback form",
  },
];

export const BOB_EXTERNAL_FORM_LINKS: BobExternalFormLink[] = [
  {
    id: "attendance_correction",
    title: "Attendance Correction",
    description:
      "Report an absence, fix sign-in/out times, or explain a special circumstance.",
    href: "/app/bob/attendance/correction",
    cta: "Open correction form",
  },
];

/** @deprecated use BOB_PROGRAM_FORMS */
export const BOB_FORMS = [...BOB_PROGRAM_FORMS, ...BOB_STAFF_FORMS];

export function getBobFormDefinition(type: string): BobFormDefinition | null {
  return BOB_FORMS.find((f) => f.type === type) ?? null;
}

export function isBobFormType(value: string | null | undefined): value is BobFormType {
  return Boolean(value && getBobFormDefinition(value));
}
