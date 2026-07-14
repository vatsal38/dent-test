"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/Skeleton";
import { STUDENT_DRAWER_TABS_CONFIG } from "../constants";
import type { StudentDrawerTabId } from "../types";

function DetailCardSkeleton({
  withHint = true,
  withAction = false,
}: {
  withHint?: boolean;
  withAction?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        {withAction ? <Skeleton className="h-3 w-8" /> : null}
      </div>
      <Skeleton className="h-5 w-14 mt-2" />
      {withHint ? <Skeleton className="h-3 w-full max-w-[180px] mt-2" /> : null}
    </div>
  );
}

function DetailCardGridSkeleton({
  cols = 2,
  count = 2,
  withHint = true,
  withAction = false,
}: {
  cols?: 2 | 3;
  count?: number;
  withHint?: boolean;
  withAction?: boolean;
}) {
  const colClass = cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${colClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <DetailCardSkeleton
          key={i}
          withHint={withHint}
          withAction={withAction}
        />
      ))}
    </div>
  );
}

function SectionTitleSkeleton({ width = "w-28" }: { width?: string }) {
  return <Skeleton className={`h-3 ${width}`} />;
}

function FieldGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full mt-1.5" />
        </div>
      ))}
    </dl>
  );
}

function CoachNoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6 mt-1.5" />
    </div>
  );
}

function ActivityTimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ol className="relative ml-1 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex gap-3 px-2">
          <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" rounded="full" />
          <div className="flex-1 pb-1">
            <Skeleton className="h-4 w-4/5 max-w-xs" />
            <Skeleton className="h-3 w-24 mt-1" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
        </li>
      ))}
    </ol>
  );
}

function WeeklyChartSkeleton() {
  const barHeights = ["h-12", "h-20", "h-14", "h-24", "h-16"];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <Skeleton className="h-3 w-36 mb-4" />
      <div className="flex items-end justify-between gap-2 h-28 px-1">
        {barHeights.map((h, i) => (
          <Skeleton key={i} className={`flex-1 rounded-t-md ${h}`} />
        ))}
      </div>
      <div className="mt-3 flex justify-between gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
    </div>
  );
}

function AttendanceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 px-4 py-3 bg-white"
        >
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" rounded="full" />
        </li>
      ))}
    </ul>
  );
}

function DeliverableCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-5 w-20 rounded-full" rounded="full" />
      </div>
      <Skeleton className="h-3 w-full mt-2" />
      <Skeleton className="h-3 w-2/3 mt-1" />
    </div>
  );
}

function IncidentCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-14 rounded-full" rounded="full" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <Skeleton className="h-4 w-4/5 mt-2" />
      <Skeleton className="h-3 w-32 mt-1" />
    </div>
  );
}

function OnboardingStatusCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-full mt-2" />
    </div>
  );
}

function OnboardingTaskSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
      <Skeleton className="h-5 w-5 rounded-full shrink-0" rounded="full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
    </div>
  );
}

export function OverviewTabSkeleton() {
  return (
    <div className="p-5 space-y-6">
      <DetailCardGridSkeleton cols={2} count={2} withAction />
      <section>
        <SectionTitleSkeleton width="w-32" />
        <div className="mt-3">
          <FieldGridSkeleton count={8} />
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionTitleSkeleton width="w-36" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="space-y-2">
          <CoachNoteCardSkeleton />
          <CoachNoteCardSkeleton />
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitleSkeleton width="w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <ActivityTimelineSkeleton count={4} />
      </section>
      <Skeleton className="h-3 w-64" />
    </div>
  );
}

export function AttendanceTabSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <DetailCardGridSkeleton cols={3} count={3} />
      <DetailCardGridSkeleton cols={3} count={3} withHint={false} />
      <WeeklyChartSkeleton />
      <div className="flex justify-end">
        <Skeleton className="h-4 w-36" />
      </div>
      <AttendanceListSkeleton count={6} />
    </div>
  );
}

export function MilestonesTabSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <DetailCardGridSkeleton cols={2} count={2} />
      <DetailCardGridSkeleton cols={3} count={3} withHint={false} />
      <div className="flex justify-between items-center">
        <SectionTitleSkeleton width="w-24" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <DeliverableCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function NotesTabSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full rounded-lg" rounded="lg" />
        <Skeleton className="h-9 w-24 rounded-lg" rounded="lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CoachNoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function IncidentsTabSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <IncidentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function OnboardingTabSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OnboardingStatusCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-4 w-full max-w-md mt-2" />
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" rounded="full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <OnboardingTaskSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DemographicsTabSkeleton() {
  return (
    <div className="p-5 space-y-6">
      <Skeleton className="h-4 w-full max-w-lg" />
      <section>
        <SectionTitleSkeleton width="w-20" />
        <div className="mt-3">
          <FieldGridSkeleton count={6} />
        </div>
      </section>
      <section>
        <SectionTitleSkeleton width="w-36" />
        <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 mt-3 space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="mt-3">
          <FieldGridSkeleton count={2} />
        </div>
      </section>
      <section>
        <SectionTitleSkeleton width="w-16" />
        <div className="mt-3">
          <FieldGridSkeleton count={4} />
        </div>
      </section>
    </div>
  );
}

export function ActivityTabSkeleton() {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-3 w-14" />
      </div>
      <ActivityTimelineSkeleton count={7} />
    </div>
  );
}

export function StudentDrawerShellSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50/30">
      <header className="bg-white border-b border-gray-200">
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-xl shrink-0" rounded="lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-7 w-48" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" rounded="full" />
                <Skeleton className="h-5 w-20 rounded-full" rounded="full" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" rounded="lg" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-5 rounded-sm" rounded="sm" />
              ))}
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="px-5 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" rounded="lg" />
            ))}
          </div>
        </div>
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" rounded="lg" />
          <Skeleton className="h-8 w-24 rounded-lg" rounded="lg" />
          <Skeleton className="h-8 w-24 rounded-lg" rounded="lg" />
          <Skeleton className="h-8 w-24 rounded-lg ml-auto" rounded="lg" />
        </div>
      </header>
      <nav className="border-b border-gray-200 bg-gray-50/95 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {STUDENT_DRAWER_TABS_CONFIG.map((t) => (
            <Skeleton
              key={t.id}
              className="h-8 w-[4.5rem] rounded-lg"
              rounded="lg"
            />
          ))}
        </div>
      </nav>
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <OverviewTabSkeleton />
      </div>
    </div>
  );
}

const TAB_SKELETONS: Record<StudentDrawerTabId, () => ReactNode> = {
  overview: () => <OverviewTabSkeleton />,
  attendance: () => <AttendanceTabSkeleton />,
  milestones: () => <MilestonesTabSkeleton />,
  notes: () => <NotesTabSkeleton />,
  incidents: () => <IncidentsTabSkeleton />,
  onboarding: () => <OnboardingTabSkeleton />,
  contracts_health: () => <OnboardingTabSkeleton />,
  demographics: () => <DemographicsTabSkeleton />,
  activity: () => <ActivityTabSkeleton />,
};

export function TabPanelSkeleton({
  tab,
}: {
  tab?: StudentDrawerTabId;
  rows?: number;
}) {
  const render = tab ? TAB_SKELETONS[tab] : TAB_SKELETONS.overview;
  return <>{render()}</>;
}
