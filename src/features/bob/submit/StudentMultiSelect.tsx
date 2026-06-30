"use client";

import { useMemo, useRef, useState } from "react";
import type { BobStudent } from "@/platform/api/bob/students";

function studentLabel(s: BobStudent) {
  return [s.firstName, s.lastName].filter(Boolean).join(" ") || s.id;
}

export function StudentMultiSelect({
  students,
  loading,
  selectedIds,
  onChange,
}: {
  students: BobStudent[];
  loading: boolean;
  selectedIds: string[];
  onChange: (ids: string[], labels: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return students.slice(0, 50);
    const q = search.trim().toLowerCase();
    return students
      .filter(
        (s) =>
          (s.firstName || "").toLowerCase().includes(q) ||
          (s.lastName || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q) ||
          (s.school || "").toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [students, search]);

  function toggleStudent(s: BobStudent) {
    const next = selectedIds.includes(s.id)
      ? selectedIds.filter((id) => id !== s.id)
      : [...selectedIds, s.id];
    const labels = students
      .filter((st) => next.includes(st.id))
      .map(studentLabel)
      .join(", ");
    onChange(next, labels);
  }

  function removeStudent(id: string) {
    const next = selectedIds.filter((sid) => sid !== id);
    const labels = students
      .filter((st) => next.includes(st.id))
      .map(studentLabel)
      .join(", ");
    onChange(next, labels);
  }

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Students
      </label>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-sm text-orange-900"
            >
              {studentLabel(s)}
              <button
                type="button"
                onClick={() => removeStudent(s.id)}
                className="text-orange-600 hover:text-orange-800"
                aria-label={`Remove ${studentLabel(s)}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <input
        type="text"
        value={open ? search : ""}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Loading students…" : "Search and select students…"}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />

      {open ? (
        <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No students match</li>
          ) : (
            filtered.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggleStudent(s)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-orange-50 ${
                      checked ? "bg-orange-50/80" : ""
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="flex-1 min-w-0">{studentLabel(s)}</span>
                    {s.school ? (
                      <span className="text-gray-500 text-xs truncate max-w-[40%]">
                        {s.school}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <p className="mt-1 text-xs text-gray-500">
        Select every student involved or impacted by this incident.
      </p>
    </div>
  );
}

export { studentLabel };
