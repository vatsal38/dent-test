"use client";

import { useCallback } from "react";
import {
  DEFAULT_STUDENT_DRAWER_TAB,
  STUDENT_DRAWER_SESSION_KEY,
} from "../constants";
import type { StudentDrawerTabId } from "../types";

function readSessionTab(): StudentDrawerTabId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STUDENT_DRAWER_SESSION_KEY);
    if (!raw) return null;
    return raw as StudentDrawerTabId;
  } catch {
    return null;
  }
}

export function useStudentDrawerSession() {
  const persistTab = useCallback((tab: StudentDrawerTabId) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STUDENT_DRAWER_SESSION_KEY, tab);
    } catch {
      /* quota / private mode */
    }
  }, []);

  const restoreTab = useCallback((): StudentDrawerTabId => {
    return readSessionTab() ?? DEFAULT_STUDENT_DRAWER_TAB;
  }, []);

  return { persistTab, restoreTab };
}
