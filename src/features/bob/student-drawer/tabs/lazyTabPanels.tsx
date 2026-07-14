"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import {
  ActivityTabSkeleton,
  AttendanceTabSkeleton,
  DemographicsTabSkeleton,
  IncidentsTabSkeleton,
  MilestonesTabSkeleton,
  NotesTabSkeleton,
  OnboardingTabSkeleton,
  OverviewTabSkeleton,
} from "../widgets/TabPanelSkeleton";
import type { StudentDrawerTabId } from "../types";

export const LazyOverviewTab = dynamic(
  () => import("./panels/OverviewTab").then((m) => m.OverviewTab),
  { loading: () => <OverviewTabSkeleton />, ssr: false },
);
export const LazyAttendanceTab = dynamic(
  () => import("./panels/AttendanceTab").then((m) => m.AttendanceTab),
  { loading: () => <AttendanceTabSkeleton />, ssr: false },
);
export const LazyMilestonesTab = dynamic(
  () => import("./panels/MilestonesTab").then((m) => m.MilestonesTab),
  { loading: () => <MilestonesTabSkeleton />, ssr: false },
);
export const LazyNotesTab = dynamic(
  () => import("./panels/NotesTab").then((m) => m.NotesTab),
  { loading: () => <NotesTabSkeleton />, ssr: false },
);
export const LazyIncidentsTab = dynamic(
  () => import("./panels/IncidentsTab").then((m) => m.IncidentsTab),
  { loading: () => <IncidentsTabSkeleton />, ssr: false },
);
export const LazyOnboardingTab = dynamic(
  () => import("./panels/OnboardingTab").then((m) => m.OnboardingTab),
  { loading: () => <OnboardingTabSkeleton />, ssr: false },
);
export const LazyContractsHealthTab = dynamic(
  () =>
    import("./panels/ContractsHealthTab").then((m) => m.ContractsHealthTab),
  { loading: () => <OnboardingTabSkeleton />, ssr: false },
);
export const LazyDemographicsTab = dynamic(
  () => import("./panels/DemographicsTab").then((m) => m.DemographicsTab),
  { loading: () => <DemographicsTabSkeleton />, ssr: false },
);
export const LazyActivityTab = dynamic(
  () => import("./panels/ActivityTab").then((m) => m.ActivityTab),
  { loading: () => <ActivityTabSkeleton />, ssr: false },
);

const PANELS: Record<StudentDrawerTabId, ComponentType> = {
  overview: LazyOverviewTab,
  attendance: LazyAttendanceTab,
  milestones: LazyMilestonesTab,
  notes: LazyNotesTab,
  incidents: LazyIncidentsTab,
  onboarding: LazyOnboardingTab,
  contracts_health: LazyContractsHealthTab,
  demographics: LazyDemographicsTab,
  activity: LazyActivityTab,
};

export function StudentDrawerTabPanel({ tab }: { tab: StudentDrawerTabId }) {
  const Panel = PANELS[tab];
  return <Panel />;
}
