import type { DashboardLayoutConfig } from "../types";
import { COACH_HOME_KPIS, COMMAND_CENTER_KPIS, POD_OPS_KPIS } from "./metrics";

export const DASHBOARD_LAYOUTS: Record<
  import("../types").DashboardLayoutId,
  DashboardLayoutConfig
> = {
  command_center: {
    id: "command_center",
    sections: [
      {
        id: "kpis",
        widgets: [
          {
            id: "cc-kpis",
            kind: "kpi_row",
            metrics: COMMAND_CENTER_KPIS,
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "attention",
        widgets: [
          {
            id: "cc-escalation",
            kind: "attention_summary",
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "operations",
        title: "Operations",
        columns: 3,
        widgets: [
          {
            id: "cc-queues",
            kind: "action_queues",
            title: "Action queues",
            colSpan: 8,
            permissions: ["dashboard.view"],
          },
          {
            id: "cc-onboarding",
            kind: "onboarding_summary",
            title: "Onboarding",
            colSpan: 4,
            permissions: ["dashboard.view", "roster.view"],
          },
        ],
      },
      {
        id: "today",
        title: "Today",
        columns: 3,
        widgets: [
          {
            id: "cc-attendance",
            kind: "attendance_summary",
            title: "Attendance by track",
            colSpan: 8,
            permissions: ["dashboard.view", "attendance.view"],
          },
          {
            id: "cc-at-risk",
            kind: "at_risk_list",
            title: "At-Risk Students",
            colSpan: 4,
            permissions: ["dashboard.view", "roster.view"],
          },
        ],
      },
      {
        id: "milestones_and_wellness",
        columns: 3,
        widgets: [
          {
            id: "cc-milestones",
            kind: "milestone_summary",
            title: "Deliverable Submissions by Track",
            colSpan: 8,
            permissions: ["dashboard.view", "milestones.view"],
          },
          {
            id: "cc-wellness",
            kind: "wellness_distribution",
            title: "Wellness Distribution",
            colSpan: 4,
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "weekly_and_blitz",
        columns: 3,
        widgets: [
          {
            id: "cc-weekly-progress",
            kind: "weekly_milestone_progress",
            title: "Weekly Deliverable Progress",
            colSpan: 8,
            permissions: ["dashboard.view"],
          },
          {
            id: "cc-blitz",
            kind: "blitz_teams",
            title: "Blitz Teams",
            colSpan: 4,
            permissions: ["dashboard.view"],
          },
        ],
      },
    ],
  },
  coach_home: {
    id: "coach_home",
    sections: [
      {
        id: "kpis",
        widgets: [
          {
            id: "coach-kpis",
            kind: "kpi_row",
            metrics: COACH_HOME_KPIS,
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "attention",
        widgets: [
          {
            id: "coach-escalation",
            kind: "attention_summary",
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "quick",
        widgets: [
          {
            id: "coach-quick-actions",
            kind: "quick_actions",
            permissions: ["dashboard.view"],
          },
        ],
      },
      {
        id: "today",
        title: "Today on your pod",
        columns: 3,
        widgets: [
          {
            id: "coach-attendance",
            kind: "attendance_summary",
            title: "Attendance today",
            colSpan: 8,
            permissions: ["dashboard.view", "attendance.view"],
          },
          {
            id: "coach-at-risk",
            kind: "at_risk_list",
            title: "Students needing attention",
            colSpan: 4,
            permissions: ["dashboard.view", "roster.view"],
          },
        ],
      },
      {
        id: "work",
        title: "Your queues",
        columns: 2,
        widgets: [
          {
            id: "coach-queues",
            kind: "action_queues",
            title: "Action queues",
            colSpan: 6,
            permissions: ["dashboard.view"],
          },
          {
            id: "coach-milestones",
            kind: "milestone_summary",
            title: "Deliverables on your pod",
            colSpan: 6,
            permissions: ["dashboard.view", "milestones.view"],
          },
        ],
      },
    ],
  },
  command_center_reports: {
    id: "command_center_reports",
    sections: [
      {
        id: "reports-kpis",
        title: "Program overview",
        widgets: [
          {
            id: "rpt-kpis",
            kind: "kpi_row",
            metrics: COMMAND_CENTER_KPIS,
            permissions: ["dashboard.reports"],
          },
        ],
      },
      {
        id: "reports-detail",
        columns: 1,
        widgets: [
          {
            id: "rpt-attendance",
            kind: "attendance_summary",
            title: "Attendance by track",
            permissions: ["dashboard.reports"],
          },
          {
            id: "rpt-milestones",
            kind: "milestone_summary",
            title: "Deliverable submission by track",
            permissions: ["dashboard.reports"],
          },
          {
            id: "rpt-at-risk",
            kind: "at_risk_list",
            title: "At-risk students",
            permissions: ["dashboard.reports"],
          },
          {
            id: "rpt-blitz",
            kind: "blitz_teams",
            title: "Blitz Teams",
            permissions: ["dashboard.reports"],
          },
        ],
      },
    ],
  },
  pod_ops: {
    id: "pod_ops",
    sections: [
      {
        id: "pod-kpis",
        title: "Track health",
        widgets: [
          {
            id: "pod-kpis",
            kind: "kpi_row",
            metrics: POD_OPS_KPIS,
            minScope: "pod",
            permissions: ["pods.view"],
          },
        ],
      },
      {
        id: "pod-attention",
        columns: 2,
        widgets: [
          { id: "pod-attendance", kind: "attendance_summary", colSpan: 6 },
          { id: "pod-queues", kind: "action_queues", colSpan: 6 },
          { id: "pod-milestones", kind: "milestone_summary", colSpan: 6 },
          { id: "pod-at-risk", kind: "at_risk_list", colSpan: 6 },
        ],
      },
    ],
  },
  student_ops: {
    id: "student_ops",
    sections: [
      {
        id: "student-kpis",
        widgets: [
          {
            id: "stu-kpis",
            kind: "kpi_row",
            metrics: [
              "checkedInToday",
              "deliverablesSubmitted",
              "openIncidents",
            ],
            minScope: "student",
          },
        ],
      },
      {
        id: "student-alerts",
        widgets: [
          { id: "stu-alerts", kind: "alert_strip" },
          {
            id: "stu-onboarding",
            kind: "onboarding_summary",
            title: "Onboarding",
          },
        ],
      },
    ],
  },
};
