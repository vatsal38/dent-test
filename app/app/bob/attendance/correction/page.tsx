import { Suspense } from "react";
import { AttendanceCorrectionPage } from "@/features/bob/attendance/AttendanceCorrectionPage";

/** Youth self-service attendance correction (ticket 68). */
export default function AttendanceCorrectionRoutePage() {
  return (
    <Suspense fallback={null}>
      <AttendanceCorrectionPage />
    </Suspense>
  );
}
