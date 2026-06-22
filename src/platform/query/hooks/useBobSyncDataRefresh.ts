"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bobKeys } from "@/platform/query/queryKeys";
import { useBobAirtableStatus } from "./useBobAirtableStatus";

/** After a BoB Airtable sync finishes, refresh dashboard and roster queries. */
export function useBobSyncDataRefresh() {
  const qc = useQueryClient();
  const { data: status } = useBobAirtableStatus();
  const wasRunning = useRef(false);

  useEffect(() => {
    if (wasRunning.current && !status?.running) {
      qc.invalidateQueries({ queryKey: bobKeys.dashboard() });
      qc.invalidateQueries({ queryKey: bobKeys.stats() });
      qc.invalidateQueries({ queryKey: bobKeys.students.all() });
      qc.invalidateQueries({ queryKey: bobKeys.pods.all() });
      qc.invalidateQueries({ queryKey: bobKeys.milestones.all() });
      qc.invalidateQueries({ queryKey: bobKeys.attendance.all() });
    }
    wasRunning.current = Boolean(status?.running);
  }, [status?.running, qc]);
}
