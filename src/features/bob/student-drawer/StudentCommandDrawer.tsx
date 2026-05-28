"use client";

import { useMemo } from "react";
import { Drawer } from "@/components/Drawer";
import { Skeleton } from "@/components/Skeleton";
import { parseApiError } from "@/platform/api/errors";
import { useBobStudentDetail } from "@/platform/query/hooks/useBobStudents";
import { STUDENT_DRAWER_WIDTH } from "./constants";
import { StudentDrawerContext } from "./context/StudentDrawerContext";
import { StudentDrawerHeader } from "./header/StudentDrawerHeader";
import { StudentDrawerTabs } from "./tabs/StudentDrawerTabs";
import { StudentDrawerTabPanel } from "./tabs/lazyTabPanels";
import type { StudentDrawerContextValue, StudentDrawerTabId } from "./types";

export interface StudentCommandDrawerProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  tab: StudentDrawerTabId;
  onTabChange: (tab: StudentDrawerTabId) => void;
}

/**
 * Right-side student command center — CRM-style operational profile.
 * Shell data (header) loads immediately; tab panels lazy-load per active tab.
 */
export function StudentCommandDrawer({
  studentId,
  open,
  onClose,
  tab,
  onTabChange,
}: StudentCommandDrawerProps) {
  const {
    data: student,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useBobStudentDetail(open ? studentId : null);

  const ctx = useMemo<StudentDrawerContextValue | null>(() => {
    if (!studentId) return null;
    return {
      studentId,
      student,
      isLoading,
      error: error as Error | null,
      refetch,
      tab,
      setTab: onTabChange,
      open,
      onClose,
    };
  }, [
    studentId,
    student,
    isLoading,
    error,
    refetch,
    tab,
    onTabChange,
    open,
    onClose,
  ]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      widthClassName={STUDENT_DRAWER_WIDTH}
      panelClassName="!overflow-hidden"
    >
      <div className="flex flex-col h-full min-h-0 bg-gray-50/30">
        {isLoading && !student ? (
          <div className="p-6 space-y-4 bg-white">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : error && !student ? (
          <div className="p-6 bg-white">
            <p className="text-sm text-red-700">{parseApiError(error)}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-sm text-orange-600 font-medium"
            >
              Retry
            </button>
          </div>
        ) : ctx && student ? (
          <StudentDrawerContext.Provider value={ctx}>
            <StudentDrawerHeader />
            <StudentDrawerTabs />
            <div className="flex-1 min-h-0 overflow-y-auto bg-white relative">
              {isFetching && !isLoading ? (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500/80 animate-pulse z-10"
                  aria-hidden
                />
              ) : null}
              <StudentDrawerTabPanel tab={tab} />
            </div>
          </StudentDrawerContext.Provider>
        ) : null}
      </div>
    </Drawer>
  );
}
