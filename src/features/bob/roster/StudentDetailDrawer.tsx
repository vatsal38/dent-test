"use client";

import {
  StudentCommandDrawer,
  useStudentDrawerUrl,
  type StudentDrawerTabId,
} from "@/features/bob/student-drawer";

/**
 * @deprecated Prefer `<StudentDrawerHost />` in BoB layout + `useStudentDrawerUrl()`.
 * Kept for backward-compatible controlled usage on roster inbox.
 */
export function StudentDetailDrawer({
  studentId,
  open,
  onClose,
  tab: controlledTab,
  onTabChange,
}: {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  tab?: StudentDrawerTabId;
  onTabChange?: (tab: StudentDrawerTabId) => void;
}) {
  const url = useStudentDrawerUrl();
  const tab = controlledTab ?? url.tab;
  const setTab = onTabChange ?? url.setTab;

  return (
    <StudentCommandDrawer
      studentId={studentId}
      open={open}
      onClose={onClose}
      tab={tab}
      onTabChange={setTab}
    />
  );
}
