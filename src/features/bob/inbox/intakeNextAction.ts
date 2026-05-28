import type { BobRecruitmentRecord } from "@/platform/api/bob/recruitment";

export interface IntakeNextAction {
  label: string;
  description: string;
  kind: "review" | "transfer" | "approve" | "view_roster" | "none";
}

function norm(s: string | null | undefined) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

export function isTransferredRecord(record: BobRecruitmentRecord): boolean {
  return Boolean(
    record.studentsAlumsAirtableRecordId ||
      norm(record.recruitmentStatus) === "transferred",
  );
}

export function isApprovedRecord(record: BobRecruitmentRecord): boolean {
  return (
    Boolean(record.rosterStudentId) ||
    norm(record.recruitmentStatus) === "approved" ||
    norm(record.recruitmentStatus) === "active student"
  );
}

export function getIntakeNextAction(
  record: BobRecruitmentRecord,
): IntakeNextAction {
  if (record.rosterStudentId) {
    return {
      kind: "view_roster",
      label: "View on roster",
      description: "Student is on the operational roster.",
    };
  }

  if (
    isTransferredRecord(record) &&
    !isApprovedRecord(record)
  ) {
    return {
      kind: "approve",
      label: "Approve to roster",
      description: "Transfer is complete — promote to active roster.",
    };
  }

  const status = norm(record.recruitmentStatus);

  if (
    status === "ready to transfer" ||
    status === "contacted" ||
    (status === "pending review" && !isTransferredRecord(record))
  ) {
    if (!isTransferredRecord(record)) {
      return {
        kind: "transfer",
        label: "Transfer to Students & Alums",
        description: "Create or update the master student record before approval.",
      };
    }
  }

  if (status === "new lead" || status === "pending review") {
    return {
      kind: "review",
      label: "Complete review",
      description: "Verify intake details and update pipeline status.",
    };
  }

  return {
    kind: "none",
    label: "No action required",
    description: "Check pipeline status or open the full record.",
  };
}
