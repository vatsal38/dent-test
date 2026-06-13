"use client";

import type { BobStaffMember } from "@/platform/api/bob/staff";
import { staffDisplayName } from "./staffDisplay";

export function StaffMemberSelect({
  label,
  hint,
  value,
  onChange,
  staff = [],
  disabled,
  placeholder = "Unassigned",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (ref: string) => void;
  staff?: BobStaffMember[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint ? <p className="text-xs text-gray-500 mb-1.5">{hint}</p> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
      >
        <option value="">{placeholder}</option>
        {staff.map((m) => (
          <option key={m.id} value={m.assignableRef}>
            {staffDisplayName(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
