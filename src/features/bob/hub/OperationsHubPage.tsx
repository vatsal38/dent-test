"use client";

import { Suspense } from "react";
import { SubmissionsInboxPage } from "@/features/bob/submissions/SubmissionsInboxPage";

export function OperationsHubPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
      <SubmissionsInboxPage />
    </Suspense>
  );
}
