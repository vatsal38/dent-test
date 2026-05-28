"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_STUDENT_DRAWER_TAB,
  isStudentDrawerTabId,
} from "../constants";
import type { StudentDrawerTabId } from "../types";
import { useStudentDrawerSession } from "./useStudentDrawerSession";

export interface UseStudentDrawerUrlOptions {
  /** Query param for student Mongo id (default `id`). */
  idParam?: string;
  /** Query param for active tab (default `tab`). */
  tabParam?: string;
}

/**
 * URL-driven student drawer state — shareable `?id=&tab=`.
 * Preserves unrelated search params (queue, pod, filters).
 */
export function useStudentDrawerUrl(options?: UseStudentDrawerUrlOptions) {
  const idParam = options?.idParam ?? "id";
  const tabParam = options?.tabParam ?? "tab";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { persistTab, restoreTab } = useStudentDrawerSession();

  const studentId =
    searchParams.get(idParam) ?? searchParams.get("student");
  const tabRaw = searchParams.get(tabParam);
  const tab: StudentDrawerTabId = useMemo(() => {
    if (tabRaw && isStudentDrawerTabId(tabRaw)) return tabRaw;
    if (studentId && !tabRaw) return restoreTab();
    return DEFAULT_STUDENT_DRAWER_TAB;
  }, [tabRaw, studentId, restoreTab]);

  const open = Boolean(studentId);

  const updateUrl = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openStudent = useCallback(
    (id: string, nextTab?: StudentDrawerTabId) => {
      const t = nextTab ?? tab ?? DEFAULT_STUDENT_DRAWER_TAB;
      persistTab(t);
      updateUrl((sp) => {
        sp.set(idParam, id);
        sp.delete("student");
        sp.set(tabParam, t);
      });
    },
    [idParam, tabParam, tab, persistTab, updateUrl],
  );

  const closeStudent = useCallback(() => {
    updateUrl((sp) => {
      sp.delete(idParam);
      sp.delete(tabParam);
      sp.delete("student");
    });
  }, [idParam, tabParam, updateUrl]);

  const setTab = useCallback(
    (next: StudentDrawerTabId) => {
      persistTab(next);
      if (!studentId) return;
      updateUrl((sp) => {
        sp.set(tabParam, next);
      });
    },
    [persistTab, studentId, tabParam, updateUrl],
  );

  return {
    studentId,
    tab,
    open,
    openStudent,
    closeStudent,
    setTab,
    updateUrl,
  };
}
