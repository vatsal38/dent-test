import React from 'react';

const URL_CAPTURE = /(\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+)/gi;

function normalizeHref(part: string): string {
    if (/^https?:\/\//i.test(part)) return part;
    if (/^www\./i.test(part)) return `https://${part}`;
    return part;
}

/**
 * Renders plain text with http(s) and www. URLs turned into external links.
 */
export function TextWithLinks({ text, className }: { text: string; className?: string }) {
    if (!text) return null;
    const pieces = text.split(URL_CAPTURE);
    return (
        <span className={className}>
            {pieces.map((part, i) => {
                if (/^https?:\/\//i.test(part) || /^www\./i.test(part)) {
                    const href = normalizeHref(part);
                    return (
                        <a
                            key={i}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2563eb] underline underline-offset-2 break-all hover:text-[#1d4ed8]"
                        >
                            {part}
                        </a>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </span>
    );
}
