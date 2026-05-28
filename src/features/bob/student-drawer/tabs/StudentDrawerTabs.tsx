"use client";

import { STUDENT_DRAWER_TABS_CONFIG } from "../constants";
import { useStudentDrawerContext } from "../context/StudentDrawerContext";
import type { StudentDrawerTabId } from "../types";

export function StudentDrawerTabs() {
  const { tab, setTab } = useStudentDrawerContext();

  return (
    <nav
      className="sticky top-(--student-drawer-header-offset,0px) z-10 border-b border-gray-200 bg-gray-50/95 backdrop-blur px-3 py-2"
      aria-label="Student profile sections"
    >
      <div className="flex flex-wrap gap-1">
        {STUDENT_DRAWER_TABS_CONFIG.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as StudentDrawerTabId)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                active
                  ? "bg-white text-orange-700 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.shortLabel ?? t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
