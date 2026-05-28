"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBobSubmissionAttachment,
  addBobSubmissionComment,
  bulkUpdateBobSubmissions,
  getBobSubmission,
  getBobSubmissionEvents,
  getBobSubmissionFacets,
  getBobSubmissionNotifications,
  getBobSubmissions,
  updateBobSubmission,
  type BobBulkPatchBody,
  type BobSubmission,
  type BobSubmissionStatus,
  type BobSubmissionsListParams,
  type BobSubmissionsListResponse,
} from "@/platform/api/bob/submissions";
import { bobKeys } from "@/platform/query/queryKeys";

export function useBobSubmissionsList(params: BobSubmissionsListParams) {
  return useQuery({
    queryKey: bobKeys.submissions.list(params),
    queryFn: () => getBobSubmissions(params),
    refetchInterval: 60_000,
  });
}

export function useBobSubmissionNotifications(orgWide = false) {
  return useQuery({
    queryKey: bobKeys.submissions.notifications({ orgWide }),
    queryFn: () => getBobSubmissionNotifications({ limit: 12, orgWide }),
    refetchInterval: 45_000,
  });
}

export function useBobSubmissionFacets(
  params?: Pick<
    BobSubmissionsListParams,
    "assignedTo" | "search" | "excludeArchived" | "archivedOnly"
  >,
) {
  return useQuery({
    queryKey: bobKeys.submissions.facets(params),
    queryFn: () => getBobSubmissionFacets(params),
    staleTime: 30_000,
  });
}

export function useBobSubmissionDetail(id: string | null) {
  return useQuery({
    queryKey: bobKeys.submissions.detail(id ?? ""),
    queryFn: () => getBobSubmission(id!),
    enabled: Boolean(id),
  });
}

export function useBobSubmissionEvents(id: string | null) {
  return useQuery({
    queryKey: bobKeys.submissions.events(id ?? ""),
    queryFn: () => getBobSubmissionEvents(id!, 100),
    enabled: Boolean(id),
    select: (data) => data.events,
  });
}

function isSubmissionsListCache(
  data: unknown,
): data is BobSubmissionsListResponse {
  return (
    data != null &&
    typeof data === "object" &&
    Array.isArray((data as BobSubmissionsListResponse).submissions)
  );
}

/** Only patch list queries — facets/detail/events share the submissions key prefix. */
function patchListCaches(
  qc: ReturnType<typeof useQueryClient>,
  updater: (prev: BobSubmissionsListResponse) => BobSubmissionsListResponse,
) {
  qc.setQueriesData(
    {
      queryKey: bobKeys.submissions.all(),
      predicate: (query) => query.queryKey[2] === "list",
    },
    (prev) => {
      if (!isSubmissionsListCache(prev)) return prev;
      return updater(prev);
    },
  );
}

export function useUpdateBobSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateBobSubmission>[1];
    }) => updateBobSubmission(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: bobKeys.submissions.all() });
      const prevDetail = qc.getQueryData<BobSubmission>(
        bobKeys.submissions.detail(id),
      );
      const optimistic: Partial<BobSubmission> = { ...data };
      if (data.status) optimistic.lastTouchedAt = new Date().toISOString();

      if (prevDetail) {
        qc.setQueryData(bobKeys.submissions.detail(id), {
          ...prevDetail,
          ...optimistic,
        });
      }

      const prevLists = qc.getQueriesData<BobSubmissionsListResponse>({
        queryKey: bobKeys.submissions.all(),
        predicate: (query) => query.queryKey[2] === "list",
      });

      patchListCaches(qc, (prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === id ? { ...s, ...optimistic } : s,
        ),
      }));

      return { prevDetail, prevLists };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prevDetail) {
        qc.setQueryData(bobKeys.submissions.detail(id), ctx.prevDetail);
      }
      ctx?.prevLists?.forEach(([key, data]) => {
        if (data) qc.setQueryData(key, data);
      });
    },
    onSettled: (_res, _err, { id }) => {
      qc.invalidateQueries({ queryKey: bobKeys.submissions.detail(id) });
      qc.invalidateQueries({ queryKey: bobKeys.submissions.all() });
      qc.invalidateQueries({ queryKey: bobKeys.submissions.notifications() });
    },
  });
}

export function useBulkUpdateBobSubmissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BobBulkPatchBody) => bulkUpdateBobSubmissions(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bobKeys.submissions.all() });
      qc.invalidateQueries({ queryKey: bobKeys.submissions.notifications() });
    },
  });
}

export function useMoveSubmissionStatus() {
  const update = useUpdateBobSubmission();
  return {
    ...update,
    move: (id: string, status: BobSubmissionStatus) =>
      update.mutate({ id, data: { status, source: "kanban" } }),
    moveAsync: (id: string, status: BobSubmissionStatus) =>
      update.mutateAsync({ id, data: { status, source: "kanban" } }),
  };
}

export function useAddBobSubmissionComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      addBobSubmissionComment(id, content),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: bobKeys.submissions.events(id) });
      qc.invalidateQueries({ queryKey: bobKeys.submissions.detail(id) });
    },
  });
}

export function useAddBobSubmissionAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
    }: {
      id: string;
      file: { filename: string; mimeType: string; content: string };
    }) => addBobSubmissionAttachment(id, file),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: bobKeys.submissions.detail(id) });
      qc.invalidateQueries({ queryKey: bobKeys.submissions.events(id) });
    },
  });
}

export type { BobSubmissionStatus };
