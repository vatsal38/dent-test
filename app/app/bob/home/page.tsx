import { Suspense } from "react";
import { BobYouthHomePage } from "@/features/bob/youth/BobYouthHomePage";

export default function BobYouthHomeRoute() {
  return (
    <Suspense fallback={null}>
      <BobYouthHomePage />
    </Suspense>
  );
}
