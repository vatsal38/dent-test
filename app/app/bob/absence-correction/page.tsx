import { Suspense } from "react";
import { AttendanceCorrectionPage } from "@/features/bob/attendance/AttendanceCorrectionPage";

/** Alias route — redirects also configured in next.config for other legacy paths. */
export default function AbsenceCorrectionAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-6 space-y-4" aria-busy="true">
          <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
          <div className="h-64 w-full rounded-2xl border border-gray-200 bg-white animate-pulse" />
        </div>
      }
    >
      <AttendanceCorrectionPage />
    </Suspense>
  );
}
