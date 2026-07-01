"use client";

import type { WidgetKind, WidgetRenderProps } from "../types";
import { KpiRowWidget } from "./KpiRowWidget";
import { AttendanceSummaryWidget } from "./AttendanceSummaryWidget";
import { MilestoneSummaryWidget } from "./MilestoneSummaryWidget";
import { AtRiskListWidget } from "./AtRiskListWidget";
import { ActionQueuesWidget } from "./ActionQueuesWidget";
import { EscalationBannerWidget } from "./EscalationBannerWidget";
import { AlertStripWidget } from "./AlertStripWidget";
import { WellnessAlertsWidget } from "./WellnessAlertsWidget";
import { OnboardingSummaryWidget } from "./OnboardingSummaryWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { WellnessDistributionWidget } from "./WellnessDistributionWidget";
import { WeeklyMilestoneProgressWidget } from "./WeeklyMilestoneProgressWidget";
import { BlitzTeamsWidget } from "./BlitzTeamsWidget";
import { MyProjectTeamWidget } from "./MyProjectTeamWidget";
import { AlertsDropdownWidget } from "./AlertsDropdownWidget";
import { ProjectTeamDeliverablesWidget } from "./ProjectTeamDeliverablesWidget";

type WidgetComponent = (props: WidgetRenderProps) => React.ReactNode;

export const WIDGET_REGISTRY: Record<WidgetKind, WidgetComponent> = {
  kpi_row: KpiRowWidget,
  alert_strip: AlertStripWidget,
  attention_summary: EscalationBannerWidget,
  action_queues: ActionQueuesWidget,
  attendance_summary: AttendanceSummaryWidget,
  milestone_summary: MilestoneSummaryWidget,
  project_team_deliverables: ProjectTeamDeliverablesWidget,
  onboarding_summary: OnboardingSummaryWidget,
  wellness_alerts: WellnessAlertsWidget,
  alerts_dropdown: AlertsDropdownWidget,
  wellness_distribution: WellnessDistributionWidget,
  at_risk_list: AtRiskListWidget,
  weekly_milestone_progress: WeeklyMilestoneProgressWidget,
  blitz_teams: BlitzTeamsWidget,
  my_project_team: MyProjectTeamWidget,
  quick_actions: () => <QuickActionsWidget />,
  escalation_banner: EscalationBannerWidget,
  notifications: AlertStripWidget,
};

export function renderWidget(
  kind: WidgetKind,
  props: WidgetRenderProps,
): React.ReactNode {
  const Component = WIDGET_REGISTRY[kind];
  if (!Component) return null;
  return <Component {...props} />;
}
