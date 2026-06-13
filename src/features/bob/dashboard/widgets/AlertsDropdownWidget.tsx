"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineBell } from "react-icons/hi";
import type { WidgetPlacement, WidgetRenderProps } from "../types";
import { EscalationBannerWidget } from "./EscalationBannerWidget";
import { WellnessAlertsWidget } from "./WellnessAlertsWidget";
import { AlertStripWidget } from "./AlertStripWidget";

function deriveCount(snapshot: WidgetRenderProps["snapshot"]) {
  if (!snapshot) return 0;
  const openDiscrepancies = Number(
    snapshot.kpis?.openDiscrepancies?.value ??
      snapshot.cards?.openDiscrepancies ??
      0,
  );
  const otherAlerts = (snapshot.alerts ?? []).filter(
    (a) => a.id !== "discrepancies" && a.id !== "no-shows" && a.id !== "program-off",
  ).length;
  const atRisk = snapshot.atRiskStudents?.length ?? 0;
  const incidents = snapshot.attention?.openIncidents ?? 0;
  return openDiscrepancies + otherAlerts + atRisk + incidents;
}

export function AlertsDropdownWidget(props: WidgetRenderProps) {
  const { snapshot, loading, isRefreshing } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const count = useMemo(() => deriveCount(snapshot), [snapshot]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const basePlacement = props.placement;
  const escalationPlacement: WidgetPlacement = {
    kind: "escalation_banner",
    id: `${basePlacement.id}-escalation`,
  };
  const clockinsPlacement: WidgetPlacement = {
    kind: "wellness_alerts",
    id: `${basePlacement.id}-clockins`,
    // no title => compact banner mode in WellnessAlertsWidget
  };
  const alertsPlacement: WidgetPlacement = {
    kind: "alert_strip",
    id: `${basePlacement.id}-alerts`,
  };

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-opacity ${isRefreshing ? "opacity-80" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <HiOutlineBell className="h-5 w-5" />
        Alerts
        {loading ? (
          <span className="ml-1 h-4 w-8 rounded-full bg-gray-200 animate-pulse" />
        ) : count > 0 ? (
          <span className="ml-1 rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 text-xs font-semibold tabular-nums">
            {count}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[min(560px,calc(100vw-2rem))]">
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Alerts & Attention
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <EscalationBannerWidget
                {...props}
                placement={escalationPlacement}
              />
              <WellnessAlertsWidget
                {...props}
                placement={clockinsPlacement}
              />
              <AlertStripWidget {...props} placement={alertsPlacement} />
              {count === 0 && !loading ? (
                <p className="text-sm text-gray-600">No alerts right now.</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

