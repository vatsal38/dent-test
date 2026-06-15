"use client";

import { Skeleton } from "@/components/Skeleton";

export function AttendanceScanSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto pb-12">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-8 w-48 mb-1" />
      <Skeleton className="h-4 w-full max-w-lg mb-6" />
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"
          >
            <Skeleton className="h-7 w-8 mx-auto mb-1" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" rounded="lg" />
          </div>
        ))}
      </div>
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <Skeleton className="h-4 w-4 rounded" rounded="sm" />
            <div className="flex-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttendanceDiscrepanciesSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-4 w-40 mb-4" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mt-4 mb-6">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-10 w-36 rounded-lg" rounded="lg" />
          <Skeleton className="h-10 w-40 rounded-lg" rounded="lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-white border border-gray-200 rounded-lg"
          >
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 mt-1" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttendanceHubSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" rounded="lg" />
          ))}
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 border-b border-gray-50 flex items-center gap-4"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachPodPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 w-36 rounded-lg" rounded="lg" />
          <Skeleton className="h-10 w-28 rounded-lg" rounded="lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-0.5 w-12 mt-3 rounded-full" rounded="full" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" rounded="lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
