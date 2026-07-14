import { Suspense } from "react";
import { AttendanceCorrectionPage } from "@/features/bob/attendance/AttendanceCorrectionPage";

function CorrectionPageFallback() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4" aria-busy="true">
      <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
      <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
      <div className="h-64 w-full rounded-2xl border border-gray-200 bg-white animate-pulse" />
    </div>
  );
}

/** Youth self-service attendance correction (tickets 68 / 134). */
export default function AttendanceCorrectionRoutePage() {
  return (
    <Suspense fallback={<CorrectionPageFallback />}>
      <AttendanceCorrectionPage />
    </Suspense>
  );
}
