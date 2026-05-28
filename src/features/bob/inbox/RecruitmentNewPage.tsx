"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createBobRecruitment,
  getBobRecruitmentSchema,
} from "@/platform/api/bob/recruitment";
import type { BobRosterSchemaField } from "@/platform/api/bob/shared";
import { importantIntakeTableColumns } from "@/lib/bobIntakeColumns";

export function RecruitmentNewPage() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sch = await getBobRecruitmentSchema();
        setSchema(sch.fields || []);
      } catch {
        setSchema([]);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = label.trim();
    if (!t) {
      setError("Name / title is required (this becomes the primary field in Airtable).");
      return;
    }
    const airtableFields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (!k.trim()) continue;
      if (!String(v).trim()) continue;
      airtableFields[k] = v;
    }
    setSubmitting(true);
    try {
      await createBobRecruitment({ label: t, airtableFields });
      router.push("/app/bob/recruitment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-8 max-w-2xl">
      <Link
        href="/app/bob/recruitment"
        className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
      >
        ← Back to Recruitment
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
        New recruitment record
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Creates a row in your Airtable recruitment table and saves it here.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name / title *
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
            placeholder="e.g. School name or partnership"
          />
        </div>

        {schema && importantIntakeTableColumns(schema).length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Key intake fields (optional)
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to only set the primary name in Airtable.
            </p>
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {importantIntakeTableColumns(schema).map((f) => {
                if (!f?.name) return null;
                return (
                  <div key={f.name}>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {f.name}
                    </label>
                    <input
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
          <Link
            href="/app/bob/recruitment"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
