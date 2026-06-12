"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBobAttendance } from "@/platform/api/bob/attendance";
import { getBobMilestones, type BobDeliverable } from "@/platform/api/bob/milestones";
import { getBobSubmissions } from "@/platform/api/bob/submissions";
import { BOB_MILESTONES_ORG_ID } from "@/platform/query/hooks/useBobMilestones";
import { bobKeys } from "@/platform/query/queryKeys";
import type { StudentDrawerTabId } from "../types";
import { SUBMISSION_STATUS_LABELS } from "@/features/bob/submissions/workflow/constants";
import { cardTitle } from "@/features/bob/submissions/display";

const ATTENDANCE_WINDOW_DAYS = 42;

function dateRangeIso(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function tabEnablesFetch(tab: StudentDrawerTabId, target: StudentDrawerTabId | StudentDrawerTabId[]) {
  const targets = Array.isArray(target) ? target : [target];
  return targets.includes(tab);
}

export function useStudentAttendanceHistory(
  studentId: string | null,
  podId: string | null | undefined,
  activeTab: StudentDrawerTabId,
) {
  const range = dateRangeIso(ATTENDANCE_WINDOW_DAYS);
  const enabled =
    Boolean(studentId) &&
  tabEnablesFetch(activeTab, ["attendance", "overview", "activity", "journey"]);

  return useQuery({
    queryKey: bobKeys.students.attendance(studentId ?? "", range),
    queryFn: () =>
      getBobAttendance({
        studentId: studentId!,
        podId: podId ?? undefined,
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 200,
      }),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useStudentSubmissions(
  studentId: string | null,
  activeTab: StudentDrawerTabId,
  types?: ("incident" | "wellness_check")[],
) {
  const enabled =
    Boolean(studentId) &&
    tabEnablesFetch(activeTab, [
      "incidents",
      "overview",
      "activity",
      "journey",
      "notes",
    ]);

  return useQuery({
    queryKey: bobKeys.students.submissions(studentId ?? "", {
      types: types?.join(",") ?? "all",
    }),
    queryFn: () =>
      getBobSubmissions({
        studentId: studentId!,
        limit: 50,
        excludeArchived: false,
      }),
    enabled,
    staleTime: 45_000,
    refetchInterval: enabled ? 60_000 : false,
    select: (data) => {
      const rows = data.submissions;
      if (!types?.length) return rows;
      return rows.filter((s) => types.includes(s.type as "incident" | "wellness_check"));
    },
  });
}

export function useStudentMilestones(
  studentId: string | null,
  activeTab: StudentDrawerTabId,
  trackHint?: string | null,
) {
  const enabled =
    Boolean(studentId) &&
    tabEnablesFetch(activeTab, ["milestones", "overview", "activity", "journey"]);

  return useQuery({
    queryKey: bobKeys.students.milestones(studentId ?? ""),
    queryFn: async () => {
      const res = await getBobMilestones({ orgId: BOB_MILESTONES_ORG_ID });
      const hint = String(trackHint || "").toLowerCase();
      if (!hint) return res.data;
      return res.data.filter((m: BobDeliverable) => {
        const track = String(m.trackName || "").toLowerCase();
        return track.includes(hint) || hint.includes(track);
      });
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useStudentActivityFeed(
  studentId: string | null,
  activeTab: StudentDrawerTabId,
  podId: string | null | undefined,
) {
  const attendance = useStudentAttendanceHistory(studentId, podId, activeTab);
  const submissions = useStudentSubmissions(studentId, activeTab);
  const milestones = useStudentMilestones(studentId, activeTab);

  const items = useMemo(() => {
    const out: import("../types").ActivityTimelineItem[] = [];

    for (const a of attendance.data?.attendance ?? []) {
      if (!a.date) continue;
      out.push({
        id: `att-${a.id}`,
        at: a.updatedAt || a.createdAt || `${a.date}T12:00:00Z`,
        kind: "attendance",
        title: a.status ? `Attendance: ${a.status}` : "Attendance event",
        subtitle: a.signType || undefined,
        tone:
          a.status === "absent"
            ? "warning"
            : a.status === "present"
              ? "success"
              : "neutral",
      });
    }

    for (const s of submissions.data ?? []) {
      out.push({
        id: `sub-${s.id}`,
        at: s.updatedAt || s.createdAt,
        kind: "submission",
        title: cardTitle(s),
        subtitle: SUBMISSION_STATUS_LABELS[s.status] || s.status,
        tone: s.type === "incident" ? "danger" : "info",
        href: `/app/bob/workflow?id=${encodeURIComponent(s.id)}`,
      });
    }

    for (const m of milestones.data ?? []) {
      const at =
        m.milestoneCompletionDate ||
        m.targetCompletionDate ||
        m.createdAt ||
        new Date().toISOString();
      out.push({
        id: `mil-${m.id}`,
        at,
        kind: "milestone",
        title: m.deliverableName,
        subtitle: m.progressStatus || m.reviewStatus,
        tone: m.milestoneComplete || m.reviewStatus === "approved" ? "success" : "neutral",
      });
    }

    out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return out.slice(0, 40);
  }, [attendance.data, submissions.data, milestones.data]);

  const isLoading =
    attendance.isLoading || submissions.isLoading || milestones.isLoading;

  return { items, isLoading, refetch: () => {
    attendance.refetch();
    submissions.refetch();
    milestones.refetch();
  } };
}
