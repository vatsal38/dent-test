"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { isDentOpsPath, canAccessDentOps } from "./dentOpsRoutes";

export function useDentOpsAccess() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname() ?? "";
  const isAdmin = Boolean(user?.isAdmin);

  return {
    isAdmin,
    canAccessDentOps: canAccessDentOps(isAdmin),
    isDentOpsPath: isDentOpsPath(pathname),
    isLoading,
  };
}
