"use client";

import type { RefObject } from "react";
import type { BobStaffFormType } from "@/features/bob/submit/formsConfig";

interface StaffRequestFormFieldsProps {
  type: BobStaffFormType;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

function AttachmentPicker({
  pendingFiles,
  setPendingFiles,
  fileInputRef,
  label = "Attachments",
  hint = "Receipts, quotes, or supporting documents (2MB each).",
}: Pick<
  StaffRequestFormFieldsProps,
  "pendingFiles" | "setPendingFiles" | "fileInputRef"
> & { label?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) setPendingFiles((prev) => [...prev, ...files]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
      >
        Add files
      </button>
      {pendingFiles.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {pendingFiles.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between text-sm text-gray-600"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                }
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

export function StaffRequestFormFields({
  type,
  form,
  setForm,
  pendingFiles,
  setPendingFiles,
  fileInputRef,
}: StaffRequestFormFieldsProps) {
  if (type === "pto_request") {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={form.category ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select (optional)</option>
            <option value="vacation">Vacation / planned leave</option>
            <option value="sick">Sick leave</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              type="date"
              value={form.requestStartDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestStartDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              type="date"
              value={form.requestEndDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestEndDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={4}
            required
            placeholder="Coverage plan, reason, and anything leadership should know"
          />
        </div>
      </>
    );
  }

  if (type === "purchase_request") {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What are you purchasing?
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={3}
            required
            placeholder="Item, quantity, and how it supports the program"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.requestAmount ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestAmount: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <input
              type="text"
              value={form.requestVendor ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, requestVendor: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              placeholder="Amazon, Target, etc."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quote or product links
          </label>
          <textarea
            value={form.proofLinks ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, proofLinks: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={2}
            placeholder="One link per line"
          />
        </div>
        <AttachmentPicker
          pendingFiles={pendingFiles}
          setPendingFiles={setPendingFiles}
          fileInputRef={fileInputRef}
          label="Quotes or supporting documents"
        />
      </>
    );
  }

  if (type === "reimbursement_request") {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense type
          </label>
          <select
            value={form.category ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select (optional)</option>
            <option value="supplies">Supplies</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={3}
            required
            placeholder="What was purchased and for which program need?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USD)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.requestAmount ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, requestAmount: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            required
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt links
          </label>
          <textarea
            value={form.proofLinks ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, proofLinks: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={2}
            placeholder="One link per line"
          />
        </div>
        <AttachmentPicker
          pendingFiles={pendingFiles}
          setPendingFiles={setPendingFiles}
          fileInputRef={fileInputRef}
          label="Receipt photos or PDFs"
        />
      </>
    );
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event or session
        </label>
        <input
          type="text"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          placeholder="e.g. Week 2 pod social, field trip"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Album links
        </label>
        <textarea
          value={form.proofLinks ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, proofLinks: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={4}
          required
          placeholder="Google Photos or Drive links — one per line"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          rows={2}
          placeholder="Optional context for the media team"
        />
      </div>
    </>
  );
}

export const STAFF_FORM_TYPES = [
  "pto_request",
  "purchase_request",
  "reimbursement_request",
  "photo_upload",
] as const;

export function isStaffFormType(
  value: string | null | undefined,
): value is BobStaffFormType {
  return STAFF_FORM_TYPES.includes(value as BobStaffFormType);
}
