"use client";

import Link from "next/link";
import {
  BOB_EXTERNAL_FORM_LINKS,
  BOB_PROGRAM_FORMS,
  BOB_STAFF_FORMS,
  BOB_STUDENT_FORM_LINKS,
} from "@/features/bob/submit/formsConfig";

function FormCard({
  title,
  description,
  href,
  cta = "Open form →",
}: {
  title: string;
  description: string;
  href: string;
  cta?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-shadow"
    >
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
      <span className="mt-4 inline-flex text-sm font-medium text-orange-600">
        {cta}
      </span>
    </Link>
  );
}

export function FormsHub({
  returnHref,
  studentMode = false,
}: {
  returnHref?: string | null;
  studentMode?: boolean;
}) {
  function formHref(type: string) {
    const params = new URLSearchParams({ type });
    if (returnHref) params.set("returnTo", returnHref);
    return `/app/bob/submit?${params.toString()}`;
  }

  function externalHref(path: string) {
    if (!returnHref) return path;
    const params = new URLSearchParams();
    if (path.includes("?")) {
      const [base, qs] = path.split("?");
      const existing = new URLSearchParams(qs);
      existing.set("returnTo", returnHref);
      return `${base}?${existing.toString()}`;
    }
    params.set("returnTo", returnHref);
    return `${path}?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {studentMode ? "Submit" : "Forms"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {studentMode
                  ? "Progress updates, testimony, and program feedback. View past submissions on My submissions."
                  : "Program submissions, staff requests, student testimony, and attendance corrections."}
              </p>
            </div>
            {returnHref ? (
              <Link
                href={returnHref}
                className="text-sm text-orange-600 hover:underline shrink-0"
              >
                ← Back
              </Link>
            ) : (
              <Link
                href="/app/bob"
                className="text-sm text-orange-600 hover:underline shrink-0"
              >
                ← Dashboard
              </Link>
            )}
          </div>
        </div>

        {studentMode ? (
          <>
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Submit
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {BOB_STUDENT_FORM_LINKS.map((link) => (
                  <FormCard
                    key={link.id}
                    title={link.title}
                    description={link.description}
                    href={externalHref(link.href)}
                    cta={`${link.cta} →`}
                  />
                ))}
              </div>
            </section>
            <section>
              <Link
                href="/app/bob/my-submissions"
                className="block rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm font-medium text-orange-800 hover:bg-orange-100"
              >
                View my submissions →
              </Link>
            </section>
          </>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Program
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {BOB_PROGRAM_FORMS.map((form) => (
                  <FormCard
                    key={form.type}
                    title={form.title}
                    description={form.description}
                    href={formHref(form.type)}
                  />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Student
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {BOB_STUDENT_FORM_LINKS.map((link) => (
                  <FormCard
                    key={link.id}
                    title={link.title}
                    description={link.description}
                    href={externalHref(link.href)}
                    cta={`${link.cta} →`}
                  />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Staff requests
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {BOB_STAFF_FORMS.map((form) => (
                  <FormCard
                    key={form.type}
                    title={form.title}
                    description={form.description}
                    href={formHref(form.type)}
                  />
                ))}
                {BOB_EXTERNAL_FORM_LINKS.map((link) => (
                  <FormCard
                    key={link.id}
                    title={link.title}
                    description={link.description}
                    href={externalHref(link.href)}
                    cta={`${link.cta} →`}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
