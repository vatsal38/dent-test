"use client";

import { Suspense } from "react";
import { StudentDrawerHost } from "@/features/bob/student-drawer";
import { BobAccessProvider } from "@/platform/rbac/BobAccessProvider";
import { BobRouteGuard } from "@/platform/rbac/BobRouteGuard";

export default function BobLayout({ children }: { children: React.ReactNode }) {
  return (
    <BobAccessProvider>
      <BobRouteGuard>
        {children}
        <Suspense fallback={null}>
          <StudentDrawerHost />
        </Suspense>
      </BobRouteGuard>
    </BobAccessProvider>
  );
}
