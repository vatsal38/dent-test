"use client";

import Link from "next/link";
import type { AttendanceDiscrepancy, AttendanceWorkspaceData } from "../types";
import { resolvePodName, resolveStudentName } from "../model/resolveDisplay";

export function DiscrepancyList({
  items,
  workspace,
  onViewDetails,
}: {
  items: AttendanceDiscrepancy[];
  workspace: AttendanceWorkspaceData;
  onViewDetails?: (item: AttendanceDiscrepancy) => void;
}) {
  if (!items.length) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm bg-white border border-gray-200 rounded-lg">
        No open discrepancies in this range. Proactive alerts will appear when punches are missing.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Pod
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Issue
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {resolveStudentName(d.studentId, workspace.studentById)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.date}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {resolvePodName(d.podId, workspace.podById)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {d.kind.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {onViewDetails ? (
                  <button
                    type="button"
                    onClick={() => onViewDetails(d)}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    View →
                  </button>
                ) : (
                  <Link
                    href={`/app/bob/attendance/mark?pod=${d.podId}&date=${d.date}`}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    View →
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
