"use client";

import { createContext, useContext } from "react";
import type { StudentDrawerContextValue } from "../types";

export const StudentDrawerContext =
  createContext<StudentDrawerContextValue | null>(null);

export function useStudentDrawerContext() {
  const ctx = useContext(StudentDrawerContext);
  if (!ctx) {
    throw new Error("useStudentDrawerContext must be used within StudentCommandDrawer");
  }
  return ctx;
}
