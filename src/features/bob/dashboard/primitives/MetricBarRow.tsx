"use client";

export type MetricBarRowItem = {
  id: string;
  label: string;
  value: number;
  total: number;
  suffix?: string;
};

type Props = {
  items: MetricBarRowItem[];
  emptyMessage?: string;
  barClassName?: string;
};

export function MetricBarRow({
  items,
  emptyMessage = "No data",
  barClassName = "bg-orange-500",
}: Props) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const total = item.total || item.value || 1;
        const pct = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.id}>
            <div className="flex items-center justify-between text-sm mb-1 gap-2">
              <span className="font-medium text-gray-900 truncate">
                {item.label}
              </span>
              <span className="text-gray-600 shrink-0 tabular-nums">
                {item.value}/{total}
                {item.suffix ?? ` (${pct}%)`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
