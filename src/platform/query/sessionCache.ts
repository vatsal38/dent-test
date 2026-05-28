import type { QueryClient } from "@tanstack/react-query";
import { bobKeys } from "./queryKeys";

/** Drop cached BoB data when the signed-in user changes (logout / account switch). */
export function clearBobSessionCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: bobKeys.all });
}

/** Refetch BoB data for the current session after login/bootstrap. */
export function invalidateBobSession(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: bobKeys.all });
}
