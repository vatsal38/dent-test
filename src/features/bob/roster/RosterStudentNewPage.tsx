"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createBobStudent,
  getBobRosterSchema,
  BOB_STUDENT_STATUSES,
  BOB_INTERVIEW_STAGES,
  type BobRosterSchemaField,
  type BobStudentStatus,
  type BobInterviewStage,
} from "@/platform/api/bob/students";

const STATUS_LABELS: Record<BobStudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

const STAGE_LABELS: Record<BobInterviewStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  not_placed: "Not placed",
};

type AirtableGroup = "contact" | "school" | "program" | "attendance" | "notes" | "other";

function classifyAirtableField(name: string): AirtableGroup {
  const n = name.toLowerCase();
  if (/(email|phone|cell|mobile|address|instagram|linkedin)/.test(n)) return "contact";
  if (/(parent|guardian|emergency|family|home phone)/.test(n)) return "contact";
  if (/(school|grade|gpa|teacher|counselor)/.test(n)) return "school";
  if (/(dent|track|pod|coach|start date|enroll|placement|pronoun|preferred)/.test(n))
    return "program";
  if (/(attendance|present|absent|tardy)/.test(n)) return "attendance";
  if (/(note|notes|comment|reflection)/.test(n)) return "notes";
  return "other";
}

/** Shown in step 1 — keep out of Airtable-only steps to avoid duplicate inputs. */
function isPrimaryAirtableDuplicate(name: string): boolean {
  const n = name.trim();
  const lower = n.toLowerCase();
  if (lower === "first name" || lower === "last name") return true;
  if (lower === "name") return true;
  if (lower === "student email") return true;
  if (lower === "student cell phone number") return true;
  return false;
}

function isIsoDateTimeString(s: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s.trim());
}

function isIsoDateString(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function toDateInputValue(value: string): string {
  const s = value.trim();
  if (isIsoDateString(s)) return s;
  if (isIsoDateTimeString(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(value: string): string {
  const s = value.trim();
  if (isIsoDateTimeString(s)) return s.slice(0, 16);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

type StepDef =
  | { key: "primary"; title: string; subtitle: string }
  | { key: "program"; title: string; subtitle: string }
  | { key: "airtable"; group: AirtableGroup; title: string; subtitle: string; fields: BobRosterSchemaField[] }
  | { key: "review"; title: string; subtitle: string };

function stepShortLabel(s: StepDef): string {
  if (s.key === "primary") return "Basics";
  if (s.key === "program") return "Program";
  if (s.key === "review") return "Review";
  if (s.key === "airtable") {
    const short: Record<AirtableGroup, string> = {
      contact: "Contact",
      school: "School",
      program: "Program+",
      attendance: "Attendance",
      notes: "Notes",
      other: "Other",
    };
    return short[s.group];
  }
  return "Step";
}

function stepListKey(s: StepDef, i: number): string {
  if (s.key === "airtable") return `airtable-${s.group}-${i}`;
  return `${s.key}-${i}`;
}

const GROUP_META: Record<
  AirtableGroup,
  { title: string; subtitle: string }
> = {
  contact: {
    title: "Contact & family",
    subtitle: "Emails, phones, addresses, and guardian information from Airtable",
  },
  school: {
    title: "School & education",
    subtitle: "School-related columns from Airtable",
  },
  program: {
    title: "Program details (Airtable)",
    subtitle: "Track, dates, site, and other program fields from Airtable",
  },
  attendance: {
    title: "Attendance",
    subtitle: "Attendance-related fields from Airtable",
  },
  notes: {
    title: "Notes",
    subtitle: "Notes and comments from Airtable",
  },
  other: {
    title: "Other information",
    subtitle: "Remaining columns from Airtable",
  },
};

function AirtableFieldInput({
  field,
  value,
  onChange,
}: {
  field: BobRosterSchemaField;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = field.type || "";
  const id = `af-${field.name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  if (t === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-gray-800">
        <input
          id={id}
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <span>Yes</span>
      </label>
    );
  }
  if (t === "date") {
    return (
      <input
        id={id}
        type="date"
        value={toDateInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  if (t === "dateTime") {
    return (
      <input
        id={id}
        type="datetime-local"
        value={toDateTimeLocalValue(value)}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            onChange("");
            return;
          }
          onChange(new Date(v).toISOString());
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  if (t === "multilineText") {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  if (t === "email") {
    return (
      <input
        id={id}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  if (t === "phoneNumber") {
    return (
      <input
        id={id}
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  if (t === "number" || t === "currency" || t === "percent" || t === "rating" || t === "count") {
    return (
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
    />
  );
}

export function RosterStudentNewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<BobStudentStatus>("active");
  const [interviewStage, setInterviewStage] = useState<BobInterviewStage>("applied");
  const [school, setSchool] = useState("");
  const [track, setTrack] = useState("");
  const [coach, setCoach] = useState("");
  const [stage, setStage] = useState("");
  const [ywStatus, setYwStatus] = useState("");

  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [airtableValues, setAirtableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const sch = await getBobRosterSchema();
        setSchema(sch.fields || []);
      } catch {
        setSchema([]);
      }
    })();
  }, []);

  const groupedAirtableFields = useMemo(() => {
    const list = schema || [];
    const buckets: Record<AirtableGroup, BobRosterSchemaField[]> = {
      contact: [],
      school: [],
      program: [],
      attendance: [],
      notes: [],
      other: [],
    };
    for (const f of list) {
      if (!f?.name || isPrimaryAirtableDuplicate(f.name)) continue;
      buckets[classifyAirtableField(f.name)].push(f);
    }
    (Object.keys(buckets) as AirtableGroup[]).forEach((k) => {
      buckets[k].sort((a, b) => a.name.localeCompare(b.name));
    });
    return buckets;
  }, [schema]);

  const steps: StepDef[] = useMemo(() => {
    const out: StepDef[] = [
      {
        key: "primary",
        title: "Student basics",
        subtitle: "Required information to create the student",
      },
      {
        key: "program",
        title: "School & program",
        subtitle: "Optional details we also sync to Airtable where columns match",
      },
    ];
    (Object.keys(GROUP_META) as AirtableGroup[]).forEach((group) => {
      const fields = groupedAirtableFields[group];
      if (!fields.length) return;
      const meta = GROUP_META[group];
      out.push({
        key: "airtable",
        group,
        title: meta.title,
        subtitle: meta.subtitle,
        fields,
      });
    });
    out.push({
      key: "review",
      title: "Review & create",
      subtitle: "Check everything looks right, then create the student",
    });
    return out;
  }, [groupedAirtableFields]);

  const step = steps[stepIndex] ?? steps[0];
  const totalSteps = steps.length;
  const isLast = stepIndex >= totalSteps - 1;

  function setAirtableField(name: string, value: string) {
    setAirtableValues((prev) => ({ ...prev, [name]: value }));
  }

  function validateCurrentStep(): string | null {
    if (step.key === "primary") {
      if (!firstName.trim() || !lastName.trim()) {
        return "Please enter first and last name.";
      }
    }
    return null;
  }

  function goNext() {
    const v = validateCurrentStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function goToStep(i: number) {
    if (i > stepIndex) {
      for (let j = 0; j < i; j++) {
        const candidate = steps[j];
        if (candidate.key === "primary") {
          if (!firstName.trim() || !lastName.trim()) {
            setError("Please enter first and last name before jumping ahead.");
            setStepIndex(0);
            return;
          }
        }
      }
    }
    setError(null);
    setStepIndex(i);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) {
      setError("First name and last name are required.");
      setStepIndex(0);
      return;
    }
    setSubmitting(true);
    try {
      const airtableFields: Record<string, unknown> = {};
      for (const [k, raw] of Object.entries(airtableValues)) {
        const key = k.trim();
        if (!key) continue;
        const s = raw ?? "";
        if (s.trim() === "") continue;
        if (s === "true") {
          airtableFields[key] = true;
          continue;
        }
        const field = (schema || []).find((f) => f.name === key);
        const t = field?.type || "";
        if (t === "number" || t === "currency" || t === "percent" || t === "rating" || t === "count") {
          const n = Number(s);
          airtableFields[key] = Number.isNaN(n) ? s : n;
        } else {
          airtableFields[key] = s;
        }
      }

      await createBobStudent({
        firstName: first,
        lastName: last,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        status,
        interviewStage,
        school: school.trim() || undefined,
        track: track.trim() || undefined,
        coach: coach.trim() || undefined,
        stage: stage.trim() || undefined,
        ywStatus: ywStatus.trim() || undefined,
        airtableFields: Object.keys(airtableFields).length ? airtableFields : undefined,
      });
      router.push("/app/bob/roster");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-3xl">
        <div className="mb-6">
          <Link
            href="/app/bob/roster"
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            ← Back to Roster
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add student</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete each section below. Your progress is saved only when you create the student.
        </p>

        {/* Wizard progress — horizontal rail + steps (no chip pills) */}
        <nav className="mt-8 mb-2 overflow-x-auto pb-2" aria-label="Form progress">
          <ol className="flex min-w-max items-start px-0.5 sm:min-w-0 sm:w-full">
            {steps.map((s, i) => {
              const last = i === totalSteps - 1;
              const isComplete = i < stepIndex;
              const isCurrent = i === stepIndex;
              const lineBeforeDone = i > 0 && stepIndex >= i;
              const lineAfterDone = stepIndex > i;
              return (
                <li
                  key={stepListKey(s, i)}
                  className="relative flex min-w-18 flex-1 flex-col items-center last:min-w-0 sm:min-w-0"
                >
                  <div className="flex w-full items-center">
                    <div
                      className={`h-0.5 min-w-[6px] flex-1 rounded-full transition-colors ${
                        i === 0 ? "bg-transparent" : lineBeforeDone ? "bg-orange-500" : "bg-gray-200"
                      }`}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => goToStep(i)}
                      aria-current={isCurrent ? "step" : undefined}
                      title={s.title}
                      className={`relative z-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                        isComplete
                          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                          : isCurrent
                            ? "border-orange-500 bg-white text-orange-600 shadow-md ring-4 ring-orange-100"
                            : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                      }`}
                    >
                      {isComplete ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </button>
                    <div
                      className={`h-0.5 min-w-[6px] flex-1 rounded-full transition-colors ${
                        last ? "bg-transparent" : lineAfterDone ? "bg-orange-500" : "bg-gray-200"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <span
                    className={`mt-2.5 max-w-22 text-center text-[11px] font-medium leading-snug sm:max-w-32 sm:text-xs ${
                      isCurrent ? "text-orange-900" : isComplete ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {stepShortLabel(s)}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="mb-8 flex flex-col gap-1 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{step.subtitle}</p>
          </div>
        </div>

        <form
          onSubmit={isLast ? handleSubmit : (e) => e.preventDefault()}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {step.key === "primary" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BobStudentStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {BOB_STUDENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview stage
                  </label>
                  <select
                    value={interviewStage}
                    onChange={(e) =>
                      setInterviewStage(e.target.value as BobInterviewStage)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {BOB_INTERVIEW_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {step.key === "program" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                  <input
                    type="text"
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                  <input
                    type="text"
                    value={coach}
                    onChange={(e) => setCoach(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <input
                    type="text"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">YW status</label>
                  <input
                    type="text"
                    value={ywStatus}
                    onChange={(e) => setYwStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </>
          )}

          {step.key === "airtable" && (
            <div className="space-y-4">
              {step.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.name}
                    <span className="ml-2 text-xs font-normal text-gray-400">({f.type})</span>
                  </label>
                  <AirtableFieldInput
                    field={f}
                    value={airtableValues[f.name] ?? ""}
                    onChange={(v) => setAirtableField(f.name, v)}
                  />
                </div>
              ))}
            </div>
          )}

          {step.key === "review" && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">Basics</div>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd>
                      {firstName} {lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd>{email.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd>{phone.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status / stage</dt>
                    <dd>
                      {STATUS_LABELS[status]} · {STAGE_LABELS[interviewStage]}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">School & program</div>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                  <div>
                    <dt className="text-gray-500">School</dt>
                    <dd>{school.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Track</dt>
                    <dd>{track.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Coach</dt>
                    <dd>{coach.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Stage</dt>
                    <dd>{stage.trim() || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">YW status</dt>
                    <dd>{ywStatus.trim() || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">Extra Airtable fields</div>
                <p className="text-xs text-gray-500 mt-1">
                  {Object.keys(airtableValues).filter((k) => (airtableValues[k] || "").trim() !== "")
                    .length
                    ? "You filled in some Airtable columns on the previous steps."
                    : "No extra Airtable fields filled in."}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Back
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={goNext}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? "Creating…" : "Create student"}
              </button>
            )}
            <Link
              href="/app/bob/roster"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
