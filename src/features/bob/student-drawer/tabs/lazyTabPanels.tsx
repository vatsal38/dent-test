"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { TabPanelSkeleton } from "../widgets/TabPanelSkeleton";
import type { StudentDrawerTabId } from "../types";

const loading = () => <TabPanelSkeleton />;

export const LazyOverviewTab = dynamic(
  () => import("./panels/OverviewTab").then((m) => m.OverviewTab),
  { loading, ssr: false },
);
export const LazyAttendanceTab = dynamic(
  () => import("./panels/AttendanceTab").then((m) => m.AttendanceTab),
  { loading, ssr: false },
);
export const LazyMilestonesTab = dynamic(
  () => import("./panels/MilestonesTab").then((m) => m.MilestonesTab),
  { loading, ssr: false },
);
export const LazyNotesTab = dynamic(
  () => import("./panels/NotesTab").then((m) => m.NotesTab),
  { loading, ssr: false },
);
export const LazyIncidentsTab = dynamic(
  () => import("./panels/IncidentsTab").then((m) => m.IncidentsTab),
  { loading, ssr: false },
);
export const LazyJourneyTab = dynamic(
  () => import("./panels/JourneyTab").then((m) => m.JourneyTab),
  { loading, ssr: false },
);
export const LazyOnboardingTab = dynamic(
  () => import("./panels/OnboardingTab").then((m) => m.OnboardingTab),
  { loading, ssr: false },
);
export const LazyDemographicsTab = dynamic(
  () => import("./panels/DemographicsTab").then((m) => m.DemographicsTab),
  { loading, ssr: false },
);
export const LazyActivityTab = dynamic(
  () => import("./panels/ActivityTab").then((m) => m.ActivityTab),
  { loading, ssr: false },
);

const PANELS: Record<StudentDrawerTabId, ComponentType> = {
  overview: LazyOverviewTab,
  attendance: LazyAttendanceTab,
  milestones: LazyMilestonesTab,
  notes: LazyNotesTab,
  incidents: LazyIncidentsTab,
  journey: LazyJourneyTab,
  onboarding: LazyOnboardingTab,
  demographics: LazyDemographicsTab,
  activity: LazyActivityTab,
};

export function StudentDrawerTabPanel({ tab }: { tab: StudentDrawerTabId }) {
  const Panel = PANELS[tab];
  return <Panel />;
}
