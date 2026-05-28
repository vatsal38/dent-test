import { Suspense } from "react";
import { AttendanceHubPage } from "@/features/bob/attendance";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AttendanceHubPage />
    </Suspense>
  );
}
