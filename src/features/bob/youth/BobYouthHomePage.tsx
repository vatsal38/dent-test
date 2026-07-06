"use client";

import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";

const ACTIONS = [
  {
    title: "Absence & sign-in/out correction",
    description:
      "Report upcoming absences or correct sign-in and sign-out times for days you attended.",
    href: "/app/bob/attendance/correction",
    cta: "Open correction form",
  },
  {
    title: "Weekly progress update",
    description:
      "Submit your team's deliverable progress, proof, and reflection for this week.",
    href: "/app/bob/progress-update",
    cta: "Submit update",
  },
  {
    title: "Dent testimony",
    description:
      "Share your story in writing or by video link — with consent for public program use.",
    href: "/app/bob/testimony",
    cta: "Submit testimony",
  },
  {
    title: "Deliverables",
    description:
      "See your project team's deliverable status and due dates.",
    href: "/app/bob/deliverables",
    cta: "View deliverables",
  },
  {
    title: "One-Stop Submit",
    description:
      "Report an incident, share feedback, or log parent contact.",
    href: "/app/bob/submit",
    cta: "Open submit form",
  },
];

export function BobYouthHomePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Bet on Baltimore"
        title="Welcome"
        description="Use DentOS to submit updates and reach your program team. Staff manage roster, attendance, and deliverables separately."
      />

      <div className="grid gap-4">
        {ACTIONS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-orange-200 hover:shadow-md transition-all group"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
              {item.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            <p className="text-sm font-medium text-orange-600 mt-3">{item.cta} →</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-500">
        Need help? Talk to your coach or site supporter — they can open your
        student record from the staff roster.
      </p>
    </div>
  );
}
