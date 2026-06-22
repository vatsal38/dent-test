"use client";

import Link from "next/link";
import { BOB_MY_POD } from "@/lib/bobDisplayTerminology";
import type { BobPermissionId } from "@/platform/rbac/permissions";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";

type QuickLink = {
  label: string;
  desc: string;
  href: string;
  perm: BobPermissionId;
};

const LEADERSHIP_LINKS: QuickLink[] = [
  {
    label: "Intake pipeline",
    desc: "Review & transfer",
    href: "/app/bob/recruitment",
    perm: "intake.view",
  },
  {
    label: "Roster",
    desc: "Active students",
    href: "/app/bob/roster",
    perm: "roster.view",
  },
  {
    label: "Operations inbox",
    desc: "Incidents & wellness",
    href: "/app/bob/inbox",
    perm: "inbox.view",
  },
  {
    label: BOB_MY_POD,
    desc: "Your students",
    href: "/app/bob/my-pod",
    perm: "myPod.view",
  },
  {
    label: "Attendance",
    desc: "Mark & view",
    href: "/app/bob/attendance",
    perm: "attendance.view",
  },
  {
    label: "Deliverables",
    desc: "Program deliverables",
    href: "/app/bob/deliverables",
    perm: "milestones.view",
  },
];

function coachLinks(podId: string | null): QuickLink[] {
  const markHref = podId
    ? `/app/bob/attendance/mark?pod=${encodeURIComponent(podId)}`
    : "/app/bob/attendance/mark";
  const rosterHref = podId
    ? `/app/bob/roster?pod=${encodeURIComponent(podId)}`
    : "/app/bob/roster";

  return [
    {
      label: BOB_MY_POD,
      desc: "Student list & shortcuts",
      href: "/app/bob/my-pod",
      perm: "myPod.view",
    },
    {
      label: "Issue triage",
      desc: "Today's attendance gaps",
      href: markHref,
      perm: "attendance.mark",
    },
    {
      label: "Log incident",
      desc: "Report or wellness check",
      href: "/app/bob/submit",
      perm: "submit.view",
    },
    {
      label: "Roster",
      desc: "Your students",
      href: rosterHref,
      perm: "roster.view",
    },
    {
      label: "Operations inbox",
      desc: "Open incidents",
      href: "/app/bob/inbox",
      perm: "inbox.view",
    },
    {
      label: "Deliverables",
      desc: "Track progress",
      href: "/app/bob/deliverables",
      perm: "milestones.view",
    },
  ];
}

const SITE_SUPPORTER_LINKS: QuickLink[] = [
  {
    label: "Roster",
    desc: "Students on your site",
    href: "/app/bob/roster",
    perm: "roster.view",
  },
  {
    label: "Issue triage",
    desc: "Today's attendance gaps",
    href: "/app/bob/attendance/mark",
    perm: "attendance.mark",
  },
  {
    label: "Log incident",
    desc: "Report or wellness check",
    href: "/app/bob/submit",
    perm: "submit.view",
  },
  {
    label: "Operations inbox",
    desc: "Open incidents",
    href: "/app/bob/inbox",
    perm: "inbox.view",
  },
  {
    label: "Attendance",
    desc: "Hub & history",
    href: "/app/bob/attendance",
    perm: "attendance.view",
  },
  {
    label: "Deliverables",
    desc: "Track progress",
    href: "/app/bob/deliverables",
    perm: "milestones.view",
  },
];

export function QuickActionsWidget() {
  const { can, role } = useBobAccess();
  const { data: me } = useBobMe();
  const podId = me?.primaryPod?.id ?? null;

  const catalog =
    role === "coach"
      ? coachLinks(podId)
      : role === "site_supporter"
        ? SITE_SUPPORTER_LINKS
        : LEADERSHIP_LINKS;

  const links = catalog.filter((l) => can(l.perm));
  const heading =
    role === "coach" || role === "site_supporter"
      ? "Quick actions"
      : "Quick links";

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((card) => (
          <Link
            key={`${card.href}-${card.label}`}
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
