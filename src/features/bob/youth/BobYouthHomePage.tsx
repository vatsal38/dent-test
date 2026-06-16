"use client";

import Link from "next/link";
import { PageHeader } from "@/design-system/patterns/PageHeader";

const ACTIONS = [
  {
    title: "One-Stop Submit",
    description:
      "Report an incident, share feedback, log parent contact, or submit weekly progress.",
    href: "/app/bob/submit",
    cta: "Open submit form",
  },
  {
    title: "Attendance questions",
    description:
      "If your hours or attendance look wrong, tell your coach or use Submit to reach staff. Corrections are reviewed in the attendance triage queue.",
    href: "/app/bob/submit",
    cta: "Contact staff",
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
