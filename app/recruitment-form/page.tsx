"use client";

import { useMemo, useState } from "react";

type StepKey = "about" | "school" | "guardian" | "finish";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isProbablyEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function isProbablyPhone(s: string) {
  const digits = s.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function RecruitmentFormPage() {
  const [step, setStep] = useState<StepKey>("about");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gfx, setGfx] = useState({ x: 0.5, y: 0.5 });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    school: "",
    grade: "",
    city: "",
    interest: "",
    howHeard: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    website: "", // honeypot (hidden)
  });

  const steps: Array<{ key: StepKey; title: string; subtitle: string }> = [
    { key: "about", title: "About you", subtitle: "Quick contact details" },
    { key: "school", title: "School info", subtitle: "Help us support you" },
    { key: "guardian", title: "Guardian (optional)", subtitle: "If you want us to reach out" },
    { key: "finish", title: "Review", subtitle: "Submit when ready" },
  ];

  const idx = steps.findIndex((s) => s.key === step);
  const progressPct = Math.round(((idx + 1) / steps.length) * 100);

  const canContinue = useMemo(() => {
    if (step === "about") {
      if (!form.firstName.trim() || !form.lastName.trim()) return false;
      const hasAnyContact =
        Boolean(form.email.trim()) ||
        Boolean(form.phone.trim()) ||
        Boolean(form.guardianEmail.trim()) ||
        Boolean(form.guardianPhone.trim());
      if (!hasAnyContact) return false;
      if (form.email.trim() && !isProbablyEmail(form.email)) return false;
      if (form.phone.trim() && !isProbablyPhone(form.phone)) return false;
      return true;
    }
    if (step === "school") return true;
    if (step === "guardian") {
      if (form.guardianEmail.trim() && !isProbablyEmail(form.guardianEmail)) return false;
      if (form.guardianPhone.trim() && !isProbablyPhone(form.guardianPhone)) return false;
      return true;
    }
    return true;
  }, [form, step]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function next() {
    const i = steps.findIndex((s) => s.key === step);
    if (i < steps.length - 1) setStep(steps[i + 1].key);
  }

  function back() {
    const i = steps.findIndex((s) => s.key === step);
    if (i > 0) setStep(steps[i - 1].key);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const resp = await fetch("/api/bob/recruitment-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await resp.json().catch(() => ({}))) as any;
      if (!resp.ok) throw new Error(data?.error || "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute top-24 -right-28 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-8 py-10 sm:px-10 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-800">
                    Submitted
                  </div>
                  <h1 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
                    You’re all set.
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 max-w-xl">
                    Thanks for sharing your info. We’ll review it and reach out if we need any follow‑ups.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-orange-50 to-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    What happens next
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      Our team reviews your submission
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      We contact you if we need anything else
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      We share next steps when you’re ready
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setStep("about");
                    setForm({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      school: "",
                      grade: "",
                      city: "",
                      interest: "",
                      howHeard: "",
                      guardianName: "",
                      guardianEmail: "",
                      guardianPhone: "",
                      website: "",
                    });
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Submit another response
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 bg-white/60 px-8 py-4 text-center text-xs text-gray-500">
              This form is public. Please don’t include sensitive information.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: form (like reference) */}
        <div className="flex items-center justify-center px-6 py-10 sm:py-14 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-800">
                Recruitment form
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Tell us a little about you
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                No account needed. Takes about 2 minutes.
              </p>
            </div>

            {/* Open stepper + open form (no card wrapper) */}
            <div className="mb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Step {idx + 1} of {steps.length}
                  </div>
                  <div className="mt-1 text-base font-semibold text-gray-900">
                    {steps[idx]?.title}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-600">
                    {steps[idx]?.subtitle}
                  </div>
                </div>
                <div className="text-xs font-bold text-orange-700">{progressPct}%</div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {steps.map((s, i) => {
                  const active = s.key === step;
                  const done = i < idx;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStep(s.key)}
                      className={classNames(
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "border-orange-300 bg-orange-100 text-orange-800"
                          : done
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      {done ? "✓ " : ""}
                      {i + 1}. {s.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="py-1">
                {/* Honeypot */}
                <input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                {step === "about" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Aaliyah"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Johnson"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="you@example.com"
                        type="email"
                      />
                      {form.email.trim() && !isProbablyEmail(form.email) && (
                        <div className="mt-1 text-xs text-red-600">Enter a valid email.</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="(555) 555-5555"
                        type="tel"
                      />
                      {form.phone.trim() && !isProbablyPhone(form.phone) && (
                        <div className="mt-1 text-xs text-red-600">Enter a valid phone number.</div>
                      )}
                    </div>

                    <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="text-sm font-semibold text-amber-900">
                        Contact info
                      </div>
                      <div className="text-xs text-amber-800 mt-1">
                        Please provide at least one way to reach you (student or guardian email/phone).
                      </div>
                    </div>
                  </div>
                )}

                {step === "school" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School
                      </label>
                      <input
                        value={form.school}
                        onChange={(e) => set("school", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Baltimore City College"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade
                      </label>
                      <select
                        value={form.grade}
                        onChange={(e) => set("grade", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select…</option>
                        {["8", "9", "10", "11", "12", "College", "Other"].map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Baltimore"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        What are you interested in?
                      </label>
                      <textarea
                        value={form.interest}
                        onChange={(e) => set("interest", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Tell us what you’re hoping to do or learn…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        How did you hear about us?
                      </label>
                      <input
                        value={form.howHeard}
                        onChange={(e) => set("howHeard", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Friend, teacher, social media, event…"
                      />
                    </div>
                  </div>
                )}

                {step === "guardian" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        Optional
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Add a guardian contact if you’d like us to include them.
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guardian name
                      </label>
                      <input
                        value={form.guardianName}
                        onChange={(e) => set("guardianName", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Maria Johnson"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guardian email
                      </label>
                      <input
                        value={form.guardianEmail}
                        onChange={(e) => set("guardianEmail", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="guardian@example.com"
                        type="email"
                      />
                      {form.guardianEmail.trim() && !isProbablyEmail(form.guardianEmail) && (
                        <div className="mt-1 text-xs text-red-600">Enter a valid email.</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guardian phone
                      </label>
                      <input
                        value={form.guardianPhone}
                        onChange={(e) => set("guardianPhone", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="(555) 555-5555"
                        type="tel"
                      />
                      {form.guardianPhone.trim() && !isProbablyPhone(form.guardianPhone) && (
                        <div className="mt-1 text-xs text-red-600">Enter a valid phone number.</div>
                      )}
                    </div>
                  </div>
                )}

                {step === "finish" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-sm font-semibold text-gray-900">Review</div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Name</div>
                          <div className="font-medium text-gray-900">
                            {form.firstName || "—"} {form.lastName || ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">School</div>
                          <div className="font-medium text-gray-900">{form.school || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="font-medium text-gray-900">{form.email || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <div className="font-medium text-gray-900">{form.phone || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Guardian</div>
                          <div className="font-medium text-gray-900">{form.guardianName || "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Guardian contact</div>
                          <div className="font-medium text-gray-900">
                            {form.guardianEmail || form.guardianPhone || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {submitError}
                      </div>
                    )}

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500">
                        By submitting, you confirm the information is accurate to the best of your knowledge.
                      </div>
                    </div>
                  </div>
                )}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={back}
                  disabled={idx === 0 || submitting}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  {step !== "finish" ? (
                    <button
                      type="button"
                      onClick={next}
                      disabled={!canContinue || submitting}
                      className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={submitting || !canContinue}
                      className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs text-gray-500">
              This is a public form. Please don’t include sensitive information.
            </div>
          </div>
        </div>

        {/* Right: interactive graphic (no card, no info) */}
        <div
          className="hidden lg:block relative overflow-hidden"
          onMouseMove={(e) => {
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            setGfx({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
          }}
          onMouseLeave={() => setGfx({ x: 0.5, y: 0.5 })}
        >
          <div className="absolute inset-0 bg-linear-to-br from-orange-600 via-orange-500 to-amber-500" />
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(0,0,0,0.18),transparent_45%)]" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 900 900"
            aria-hidden="true"
          >
            <g
              style={{
                transform: `translate(${(gfx.x - 0.5) * 16}px, ${(gfx.y - 0.5) * 18}px)`,
                transformOrigin: "center",
              }}
            >
              <circle cx="160" cy="170" r="70" fill="rgba(255,255,255,0.14)" />
              <circle cx="740" cy="220" r="110" fill="rgba(255,255,255,0.10)" />
              <circle cx="560" cy="760" r="160" fill="rgba(255,255,255,0.08)" />
            </g>

            <g opacity="0.28" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none">
              {Array.from({ length: 14 }).map((_, i) => (
                <path
                  key={i}
                  d={`M ${100 + i * 48} 60 C ${140 + i * 40} 220, ${80 + i * 55} 420, ${140 + i * 40} 620`}
                />
              ))}
            </g>

            <g
              style={{
                transform: `translate(${(gfx.x - 0.5) * -22}px, ${(gfx.y - 0.5) * -16}px)`,
                transformOrigin: "center",
              }}
            >
              <rect x="210" y="330" width="480" height="320" rx="48" fill="rgba(0,0,0,0.20)" />
              <rect x="230" y="350" width="480" height="320" rx="48" fill="rgba(255,255,255,0.12)" />

              <rect x="285" y="430" width="350" height="110" rx="55" fill="rgba(0,0,0,0.30)" />
              <circle cx="420" cy="470" r="54" fill="rgba(255,255,255,0.85)" />
              <path
                d="M 410 465 C 430 445, 465 455, 450 488 C 442 506, 420 515, 402 504 C 387 494, 389 476, 410 465 Z"
                fill="#f97316"
              />
              <rect x="500" y="455" width="110" height="12" rx="6" fill="rgba(255,255,255,0.65)" />
              <rect x="500" y="477" width="150" height="10" rx="5" fill="rgba(255,255,255,0.45)" />

              <g opacity="0.8">
                <circle cx="650" cy="540" r="34" fill="rgba(255,255,255,0.14)" />
                <path
                  d="M 640 540 L 650 550 L 668 532"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>
            </g>
          </svg>

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.10), transparent 35%, rgba(0,0,0,0.18))",
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
}

