"use client";

import { Skeleton } from "@/components/Skeleton";
import { PageHeaderSkeleton } from "@/design-system/patterns/PageHeaderSkeleton";

function RosterQueueTabsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-lg" rounded="lg" />
      ))}
    </div>
  );
}

function RosterToolbarSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" rounded="lg" />
        <Skeleton className="h-10 w-40 rounded-lg" rounded="lg" />
        <Skeleton className="h-10 w-28 rounded-lg" rounded="lg" />
      </div>
    </div>
  );
}

function RosterGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" rounded="full" />
              <Skeleton className="h-6 w-16 rounded-full" rounded="full" />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" rounded="full" />
              <Skeleton className="h-5 w-14 rounded-full" rounded="full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RosterTableSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-14">
                <Skeleton className="h-8 w-8 rounded-full mx-auto" rounded="full" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-3 w-12" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-3 w-14" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-3 w-12" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </th>
              {Array.from({ length: 3 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td className="px-3 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" rounded="full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded-full" rounded="full" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12 rounded-full" rounded="full" />
                    <Skeleton className="h-5 w-12 rounded-full" rounded="full" />
                  </div>
                </td>
                {Array.from({ length: 3 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RosterPageSkeleton({
  embedded = false,
  view = "grid",
}: {
  embedded?: boolean;
  view?: "grid" | "table";
}) {
  return (
    <div>
      {!embedded ? <PageHeaderSkeleton actionCount={3} /> : null}
      <div className="mb-6 space-y-2">
        <RosterQueueTabsSkeleton />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl mb-6" />
      <RosterToolbarSkeleton />
      <div className="my-4 flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-36 rounded-lg" rounded="lg" />
      </div>
      {view === "grid" ? <RosterGallerySkeleton /> : <RosterTableSkeleton />}
    </div>
  );
}
