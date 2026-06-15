'use client';

import { KEY_LINK_SECTIONS } from './keyLinksConfig';
import { PageHeader } from '@/design-system/patterns/PageHeader';

export function KeyLinksPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Staff resources"
        title="Key Links"
        description="Quick access to drives, albums, and communication tools used across the program."
      />

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

      <p className="mt-10 text-xs text-gray-500">
        Link URLs are configured via{' '}
        <code className="text-gray-700">NEXT_PUBLIC_BOB_KEY_LINK_*</code> env
        vars (see <code className="text-gray-700">env.example</code>). Ask
        program ops to update with your team&apos;s folders.
      </p>
    </div>
  );
}
