import { Suspense } from "react";
import { BobCommandCenterPage } from "@/features/bob/home/BobCommandCenterPage";

export default function BobDashboardPage() {
  return (
    <Suspense fallback={null}>
      <BobCommandCenterPage />
    </Suspense>
  );
}
