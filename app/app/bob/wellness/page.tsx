import { Suspense } from "react";
import { WellnessCheckPage } from "@/features/bob/wellness/WellnessCheckPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WellnessCheckPage />
    </Suspense>
  );
}
