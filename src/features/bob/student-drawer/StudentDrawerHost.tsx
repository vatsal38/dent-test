"use client";

import { usePathname } from "next/navigation";
import { StudentCommandDrawer } from "./StudentCommandDrawer";
import { useStudentDrawerUrl } from "./hooks/useStudentDrawerUrl";

/** Routes that use `?id=` for non-student records (intake, submissions). */
const STUDENT_DRAWER_EXCLUDED_PREFIXES = [
  "/app/bob/recruitment",
  "/app/bob/inbox",
];

function isStudentDrawerRoute(pathname: string): boolean {
  return !STUDENT_DRAWER_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Global BoB student drawer driven by URL (`?id=` or legacy `?student=`, plus `?tab=`).
 * Mount once in `app/app/bob/layout.tsx`.
 */
export function StudentDrawerHost() {
  const pathname = usePathname();
  const { studentId, tab, open: urlOpen, closeStudent, setTab } = useStudentDrawerUrl();
  const routeOpen = urlOpen && isStudentDrawerRoute(pathname);
  const allowedId = routeOpen && studentId ? studentId : null;

  return (
    <StudentCommandDrawer
      studentId={allowedId}
      open={Boolean(allowedId)}
      onClose={closeStudent}
      tab={tab}
      onTabChange={setTab}
    />
  );
}
