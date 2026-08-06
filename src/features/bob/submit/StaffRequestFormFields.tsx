"use client";

import { useEffect, useState, type RefObject } from "react";
import type { BobStaffMember } from "@/platform/api/bob/staff";
import { getMileageConfig } from "@/platform/api/bob/submit";
import { staffDisplayName } from "@/features/bob/pods/staffDisplay";
import { countPtoProgramDays } from "@/features/bob/submit/ptoDays";
import { MileageLegsEditor } from "@/features/bob/submit/MileageLegsEditor";
import {
  calculateMileageReimbursement,
  DEFAULT_MILEAGE_RATE_USD,
  emptyMileageLeg,
  formatMileageAmount,
  parseMileageLegsJson,
  serializeMileageLegs,
} from "@/features/bob/submit/mileageReimbursement";
import {
  bobSubmissionAttachmentMaxLabel,
  fileExceedsBobAttachmentLimit,
} from "@/features/bob/submit/attachmentLimits";

export const STAFF_FORM_TYPES = [
  "pto_request",
  "purchase_request",
  "reimbursement_request",
  "photo_upload",
] as const;

export type StaffRequestFormType = (typeof STAFF_FORM_TYPES)[number];

interface StaffRequestFormFieldsProps {
  type: StaffRequestFormType;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  staffList?: BobStaffMember[];
  currentUserId?: string;
  currentUserName?: string;
  onAttachmentReject?: (message: string) => void;
}

function AttachmentPicker({
  pendingFiles,
  setPendingFiles,
  fileInputRef,
  label = "Attachments",
  hint,
  onAttachmentReject,
}: Pick<
  StaffRequestFormFieldsProps,
  "pendingFiles" | "setPendingFiles" | "fileInputRef" | "onAttachmentReject"
> & { label?: string; hint?: string }) {
  const sizeHint =
    hint ??
    `Receipts, quotes, or supporting documents (${bobSubmissionAttachmentMaxLabel()} each).`;
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
          const accepted: File[] = [];
          for (const file of files) {
            if (fileExceedsBobAttachmentLimit(file)) {
              onAttachmentReject?.(
                `${file.name} is over ${bobSubmissionAttachmentMaxLabel()}. Choose a smaller file.`,
              );
            } else {
              accepted.push(file);
            }
          }
          if (accepted.length) {
            setPendingFiles((prev) => [...prev, ...accepted]);
          }
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
      <p className="mt-1 text-xs text-gray-500">{sizeHint}</p>
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
  staffList = [],
  currentUserId,
  currentUserName,
  onAttachmentReject,
}: StaffRequestFormFieldsProps) {
  const [mileageRateUsd, setMileageRateUsd] = useState(DEFAULT_MILEAGE_RATE_USD);

  useEffect(() => {
    if (type !== "reimbursement_request") return;
    let cancelled = false;
    getMileageConfig()
      .then((config) => {
        if (!cancelled && config.rateUsd > 0) {
          setMileageRateUsd(config.rateUsd);
        }
      })
      .catch(() => {
        // Keep default rate when config is unavailable offline.
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const ptoDayCount =
    type === "pto_request"
      ? countPtoProgramDays(form.requestStartDate, form.requestEndDate)
      : null;

  if (type === "pto_request") {
    const ptoFor = form.ptoFor || "self";
    const sortedStaff = [...staffList].sort((a, b) =>
      staffDisplayName(a).localeCompare(staffDisplayName(b)),
    );

    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staff member out
          </label>
          <select
            value={ptoFor}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "self") {
                setForm((f) => ({
                  ...f,
                  ptoFor: "self",
                  staffMemberId: currentUserId || "",
                  staffMemberName: currentUserName || "",
                }));
              } else {
                setForm((f) => ({
                  ...f,
                  ptoFor: "other",
                  staffMemberId: "",
                  staffMemberName: "",
                }));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="self">
              Me{currentUserName ? ` (${currentUserName})` : ""}
            </option>
            <option value="other">Another staff member</option>
          </select>
        </div>
        {ptoFor === "other" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff member
            </label>
            <select
              value={form.staffMemberId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                const member = sortedStaff.find((s) => s.id === id);
                setForm((f) => ({
                  ...f,
                  staffMemberId: id,
                  staffMemberName: member?.name || member?.email || "",
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select staff member</option>
              {sortedStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {staffDisplayName(s)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Submit on behalf of someone who is out and cannot submit themselves.
            </p>
          </div>
        ) : null}
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
        {ptoDayCount != null ? (
          <p className="text-sm text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            <span className="font-semibold">{ptoDayCount}</span> program day
            {ptoDayCount === 1 ? "" : "s"} in this range (Mon–Fri, excluding
            holidays).
          </p>
        ) : null}
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
            What do you want to purchase?
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
          onAttachmentReject={onAttachmentReject}
        />
      </>
    );
  }

  if (type === "reimbursement_request") {
    const isMileage = form.category === "mileage";
    const mileageLegs = parseMileageLegsJson(form.mileageLegs);
    const mileageCalculation = isMileage
      ? calculateMileageReimbursement(mileageLegs, mileageRateUsd)
      : null;

    function setMileageLegs(nextLegs: ReturnType<typeof parseMileageLegsJson>) {
      const calc = calculateMileageReimbursement(nextLegs, mileageRateUsd);
      setForm((f) => ({
        ...f,
        mileageLegs: serializeMileageLegs(nextLegs),
        fromLocation: nextLegs[0]?.from?.trim() || "",
        toLocation: nextLegs[nextLegs.length - 1]?.to?.trim() || "",
        requestAmount: calc ? String(calc.amount) : "",
      }));
    }

    return (
      <>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 leading-relaxed">
          Reimbursements cover program-related expenses only. Commuting to or
          from home or your normal work site is not reimbursable.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense type
          </label>
          <select
            value={form.category ?? ""}
            onChange={(e) => {
              const nextCategory = e.target.value;
              setForm((f) => {
                const next: Record<string, string> = {
                  ...f,
                  category: nextCategory,
                };
                if (nextCategory === "mileage" && !f.mileageLegs) {
                  next.mileageLegs = serializeMileageLegs([emptyMileageLeg()]);
                }
                if (nextCategory !== "mileage") {
                  next.mileageLegs = "";
                }
                return next;
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select (optional)</option>
            <option value="mileage">Mileage</option>
            <option value="supplies">Supplies</option>
            <option value="food">Food</option>
            <option value="travel">Travel (non-mileage)</option>
            <option value="other">Other</option>
          </select>
        </div>
        {isMileage ? (
          <MileageLegsEditor
            legs={mileageLegs}
            rateUsd={mileageRateUsd}
            onChange={setMileageLegs}
          />
        ) : null}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
            {isMileage ? (
              <span className="font-normal text-gray-500"> (optional)</span>
            ) : null}
          </label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={3}
            required={!isMileage}
            placeholder={
              isMileage
                ? "Optional notes about the trip purpose"
                : "What was purchased and for which program need?"
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USD)
          </label>
          {isMileage ? (
            <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
              {mileageCalculation
                ? `$${formatMileageAmount(mileageCalculation.amount)}`
                : "Enter trip legs to calculate"}
            </div>
          ) : (
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
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt links
            <span className="font-normal text-gray-500"> (optional)</span>
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
          label="Receipt photos or PDFs (optional)"
          onAttachmentReject={onAttachmentReject}
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

export function isStaffFormType(
  value: string | null | undefined,
): value is StaffRequestFormType {
  return STAFF_FORM_TYPES.includes(value as StaffRequestFormType);
}
