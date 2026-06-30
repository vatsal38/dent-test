import { Suspense } from "react";
import { ProgressUpdatePage } from "@/features/bob/progress/ProgressUpdatePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProgressUpdatePage />
    </Suspense>
  );
}
