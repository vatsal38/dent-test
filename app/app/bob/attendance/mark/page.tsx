import { Suspense } from "react";
import { AttendanceScanPage } from "@/features/bob/attendance";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AttendanceScanPage />
    </Suspense>
  );
}
