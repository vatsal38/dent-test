"use client";

import { AlertStrip } from "../primitives/AlertBanner";
import { DashboardWidgetSkeleton } from "../primitives/DashboardWidgetSkeleton";
import type { WidgetRenderProps } from "../types";

export function AlertStripWidget({ snapshot, loading }: WidgetRenderProps) {
  if (loading) return <DashboardWidgetSkeleton variant="banner" />;
  const alerts = snapshot?.alerts ?? [];
  if (!alerts.length) return null;
  return <AlertStrip alerts={alerts} />;
}
