import { redirect } from "next/navigation";

/** Youth submit corrections via One Stop — staff triage in discrepancies. */
export default function AttendanceCorrectionRoutePage() {
  redirect("/app/bob/attendance/discrepancies");
}
