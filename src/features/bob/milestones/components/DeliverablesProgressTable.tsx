import {
  computeDeliverableTrackStats,
  computeOverallDeliverableStats,
  type DeliverableTrackStats,
} from "../deliverableDisplay";
import type { BobDeliverable } from "@/platform/api/bob/milestones";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

function StatsCells({ stats }: { stats: Omit<DeliverableTrackStats, "trackName"> }) {
  return (
    <>
      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900">
        {stats.pctDueCompleted}%
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
        {stats.completedCount}/{stats.dueCount}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
        {stats.pctDueSubmitted}%
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
        {stats.submittedCount}/{stats.dueCount}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums pr-4">
        {stats.overdueCount > 0 ? (
          <span className="text-red-700 font-medium">{stats.overdueCount}</span>
        ) : (
          <span className="text-gray-400">0</span>
        )}
      </td>
    </>
  );
}

export function DeliverablesProgressTable({
  deliverables,
}: {
  deliverables: BobDeliverable[];
}) {
  const overall = computeOverallDeliverableStats(deliverables);
  const byTrack = computeDeliverableTrackStats(deliverables);

  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Due deliverables progress
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          All tracks in one view — percentages count only deliverables past their
          target completion date.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 font-medium">Track</th>
              <th className="px-3 py-2.5 font-medium text-right">% complete</th>
              <th className="px-3 py-2.5 font-medium text-right">Completed</th>
              <th className="px-3 py-2.5 font-medium text-right">% submitted</th>
              <th className="px-3 py-2.5 font-medium text-right">Submitted</th>
              <th className="px-3 py-2.5 font-medium text-right pr-4">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="bg-orange-50/40">
              <td className="px-4 py-2.5 font-semibold text-gray-900">All tracks</td>
              <StatsCells stats={overall} />
            </tr>
            {byTrack.map((t) => (
              <tr key={t.trackName} className="hover:bg-gray-50/60">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {formatBobTrackDisplayLabel(t.trackName)}
                </td>
                <StatsCells stats={t} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
