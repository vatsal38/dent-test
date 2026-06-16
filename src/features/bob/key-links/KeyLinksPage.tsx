'use client';

import { KEY_LINK_SECTIONS } from './keyLinksConfig';
import { PageHeader } from '@/design-system/patterns/PageHeader';

const PLACEHOLDER_HOSTS = new Set([
  'drive.google.com',
  'photos.google.com',
  'slack.com',
  'mail.google.com',
]);

function isPlaceholderUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return PLACEHOLDER_HOSTS.has(host) && !url.includes('/folders/') && !url.includes('/drive/');
  } catch {
    return true;
  }
}

export function KeyLinksPage() {
  const needsConfig = KEY_LINK_SECTIONS.some((section) =>
    section.links.some((link) => isPlaceholderUrl(link.url)),
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Staff resources"
        title="Key Links"
        description="Quick access to drives, albums, and communication tools used across the program."
      />

      {needsConfig ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some links still use generic placeholders. Program ops should set your
          team&apos;s URLs in Vercel as{' '}
          <code className="text-amber-950">NEXT_PUBLIC_BOB_KEY_LINK_*</code> (see{' '}
          <code className="text-amber-950">env.example</code>).
        </div>
      ) : null}

      <div className="space-y-8">
        {KEY_LINK_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            {section.description ? (
              <p className="text-sm text-gray-600 mt-1 mb-4">{section.description}</p>
            ) : (
              <div className="mb-4" />
            )}
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-orange-300 hover:shadow-sm transition-all group"
                  >
                    <span className="font-medium text-orange-600 group-hover:text-orange-700">
                      {link.label} ↗
                    </span>
                    {link.description ? (
                      <span className="text-sm text-gray-500 mt-0.5">
                        {link.description}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
