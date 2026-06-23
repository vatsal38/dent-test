import type { ReactNode } from "react";
import type { BobDashboardSnapshot } from "@/platform/api/bob/dashboard";
import type { BobOpsRole } from "@/platform/rbac/types";
import type { BobPermissionId } from "@/platform/rbac/permissions";

export type DashboardScopeLevel =
  | "organization"
  | "site"
  | "pod"
  | "track"
  | "student";

/** Client-side scope selection — drives API params and layout resolution. */
export interface DashboardScope {
  level: DashboardScopeLevel;
  siteName?: string;
  podId?: string;
  track?: string;
  studentId?: string;
  label?: string;
}

export type DashboardLayoutId =
  | "command_center"
  | "command_center_reports"
  | "coach_home"
  | "site_supporter_home"
  | "pod_ops"
  | "student_ops";

export type WidgetKind =
  | "kpi_row"
  | "alert_strip"
  | "attention_summary"
  | "action_queues"
  | "attendance_summary"
  | "milestone_summary"
  | "onboarding_summary"
  | "wellness_alerts"
  | "alerts_dropdown"
  | "wellness_distribution"
  | "at_risk_list"
  | "weekly_milestone_progress"
  | "blitz_teams"
  | "quick_actions"
  | "escalation_banner"
  | "notifications";

export interface WidgetPlacement {
  kind: WidgetKind;
  id: string;
  title?: string;
  /** Grid column span at lg breakpoint (1–12, default from layout) */
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  permissions?: BobPermissionId[];
  roles?: BobOpsRole[];
  /** Metric keys for kpi_row */
  metrics?: string[];
  minScope?: DashboardScopeLevel;
}

export interface DashboardSectionConfig {
  id: string;
  title?: string;
  columns?: 1 | 2 | 3;
  widgets: WidgetPlacement[];
}

export interface DashboardLayoutConfig {
  id: DashboardLayoutId;
  sections: DashboardSectionConfig[];
}

export interface DashboardEngineProps {
  layoutId: DashboardLayoutId;
  scope?: DashboardScope;
  /** Extra header slot below scope banner */
  headerSlot?: ReactNode;
  className?: string;
}

export interface WidgetRenderProps {
  snapshot: BobDashboardSnapshot | undefined;
  loading: boolean;
  isRefreshing: boolean;
  scope: DashboardScope;
  placement: WidgetPlacement;
  onRefresh?: () => void;
}
