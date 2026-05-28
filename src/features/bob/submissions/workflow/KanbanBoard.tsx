"use client";

import { useState } from "react";
import type { BobSubmissionStatus } from "@/platform/api/bob/submissions";
import { SubmissionCard } from "@/features/bob/submissions/workflow/SubmissionCard";
import type { KanbanColumn } from "@/features/bob/submissions/workflow/useSubmissionKanban";
import type { BobSubmission } from "@/platform/api/bob/submissions";

export function KanbanBoard({
  columns,
  selectedId,
  bulkIds,
  onOpen,
  onToggleBulk,
  onMove,
  movingId,
}: {
  columns: KanbanColumn[];
  selectedId: string | null;
  bulkIds: Set<string>;
  onOpen: (id: string) => void;
  onToggleBulk: (id: string) => void;
  onMove: (id: string, toStatus: BobSubmissionStatus) => void;
  movingId: string | null;
}) {
  const [dragOverStatus, setDragOverStatus] =
    useState<BobSubmissionStatus | null>(null);

  return (
    <div className="flex gap-4 min-h-[480px] pb-8">
      {columns.map((col) => (
        <div
          key={col.status}
          className="min-w-[280px] w-[280px] flex flex-col shrink-0"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverStatus(col.status);
          }}
          onDragLeave={() => setDragOverStatus(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverStatus(null);
            const id = e.dataTransfer.getData("text/submission-id");
            const from = e.dataTransfer.getData("text/from-status");
            if (id && from !== col.status) onMove(id, col.status);
          }}
        >
          <div
            className={`px-3 py-2 rounded-lg border mb-2 flex justify-between items-center ${
              dragOverStatus === col.status
                ? "bg-orange-50 border-orange-300"
                : "bg-white border-gray-200"
            }`}
          >
            <span className="text-sm font-semibold text-gray-900">
              {col.label}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              {col.items.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[120px]">
            {col.items.length === 0 ? (
              <p
                className={`text-sm p-3 border border-dashed rounded-lg ${
                  dragOverStatus === col.status
                    ? "border-orange-300 text-orange-600 bg-orange-50/50"
                    : "text-gray-400 border-gray-200"
                }`}
              >
                Drop here
              </p>
            ) : (
              col.items.map((s: BobSubmission) => (
                <div
                  key={s.id}
                  className={
                    movingId === s.id ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  <SubmissionCard
                    submission={s}
                    selected={selectedId === s.id}
                    bulkSelected={bulkIds.has(s.id)}
                    onOpen={() => onOpen(s.id)}
                    onToggleBulk={() => onToggleBulk(s.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
