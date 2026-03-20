'use client';

import { useState } from 'react';
import type { PartnershipDetail } from '@/lib/api';
import { TextWithLinks } from '@/components/TextWithLinks';

export function AirtableNotesBlock({ partnership }: { partnership: PartnershipDetail }) {
    const [linkCopied, setLinkCopied] = useState(false);
    const orgNotes = partnership.organizationNotes?.trim() || '';
    const contactsWithNotes = partnership.contacts.filter((c) => (c.notes || '').trim());
    const hasContent = orgNotes.length > 0 || contactsWithNotes.length > 0;
    const recordUrl = partnership.airtableRecordUrl;

    async function copyRecordLink() {
        if (!recordUrl) return;
        try {
            await navigator.clipboard.writeText(recordUrl);
            setLinkCopied(true);
            window.setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            /* clipboard denied or unavailable */
        }
    }

    if (!hasContent && !recordUrl) return null;

    return (
        <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From Airtable</p>
                {recordUrl && (
                    <div className="flex items-center gap-1.5">
                        <a
                            href={recordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] inline-flex items-center gap-1"
                        >
                            Open row in Airtable
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <button
                            type="button"
                            onClick={copyRecordLink}
                            className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            title="Copy Airtable link"
                            aria-label={linkCopied ? 'Link copied' : 'Copy Airtable link'}
                        >
                            {linkCopied ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>
            {orgNotes.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/80">
                    <p className="text-[10px] font-semibold text-amber-900/80 uppercase tracking-wide mb-1.5">Organization notes</p>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        <TextWithLinks text={partnership.organizationNotes || ''} />
                    </div>
                </div>
            )}
            {contactsWithNotes.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/80">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {c.name}
                        {c.isPrimary ? ' · Primary' : ''}
                    </p>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        <TextWithLinks text={c.notes || ''} />
                    </div>
                </div>
            ))}
        </div>
    );
}
