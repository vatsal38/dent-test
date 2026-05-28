"use client";

import Link from "next/link";
import type { BobPermissionId } from "@/platform/rbac/permissions";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

const QUICK_LINKS = [
  { label: "Intake pipeline", desc: "Review & transfer", href: "/app/bob/recruitment", key: "intake", perm: "intake.view" as BobPermissionId },
  { label: "Roster", desc: "Active students", href: "/app/bob/roster", key: "roster", perm: "roster.view" as BobPermissionId },
  { label: "Operations inbox", desc: "Queues", href: "/app/bob/inbox", key: "inbox", perm: "inbox.view" as BobPermissionId },
  { label: "My pod", desc: "Your students", href: "/app/bob/my-pod", key: "my-pod", perm: "myPod.view" as BobPermissionId },
  { label: "Attendance", desc: "Mark & view", href: "/app/bob/attendance", key: "attendance", perm: "attendance.view" as BobPermissionId },
  { label: "Milestones", desc: "Program milestones", href: "/app/bob/milestones", key: "milestones", perm: "milestones.view" as BobPermissionId },
];

export function QuickActionsWidget() {
  const { can } = useBobAccess();
  const links = QUICK_LINKS.filter((l) => can(l.perm));

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-200 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
              {card.label}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
            <p className="text-xs text-orange-600 mt-2">Open →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
