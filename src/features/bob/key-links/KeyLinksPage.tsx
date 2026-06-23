'use client';

import { useMemo, useState } from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineCollection,
  HiOutlineDocumentText,
  HiOutlineDuplicate,
  HiOutlineExternalLink,
  HiOutlineFolder,
  HiOutlineHeart,
  HiOutlineLink,
  HiOutlineMail,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineTable,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';
import { PageHeader } from '@/design-system/patterns/PageHeader';
import {
  keyLinkSectionsForRole,
  type KeyLinkItem,
  type KeyLinkSection,
} from './keyLinksConfig';
import { useBobAccess } from '@/platform/rbac/useBobAccess';

type LinkKind =
  | 'drive'
  | 'photos'
  | 'calendar'
  | 'docs'
  | 'sheet'
  | 'site'
  | 'form'
  | 'email'
  | 'link';

type TrackTag = 'mad' | 'ayd' | 'denternship' | 'content' | 'general';

type SectionMeta = {
  icon: IconType;
  accent: string;
  iconBg: string;
  cardBg: string;
  ring: string;
  dot: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  curriculum: {
    icon: HiOutlineFolder,
    accent: 'text-amber-700',
    iconBg: 'bg-amber-100',
    cardBg: 'from-amber-50 to-white',
    ring: 'ring-amber-200/80',
    dot: 'bg-amber-500',
  },
  photos: {
    icon: HiOutlinePhotograph,
    accent: 'text-violet-700',
    iconBg: 'bg-violet-100',
    cardBg: 'from-violet-50 to-white',
    ring: 'ring-violet-200/80',
    dot: 'bg-violet-500',
  },
  onboarding: {
    icon: HiOutlineClipboardList,
    accent: 'text-sky-700',
    iconBg: 'bg-sky-100',
    cardBg: 'from-sky-50 to-white',
    ring: 'ring-sky-200/80',
    dot: 'bg-sky-500',
  },
  calendars: {
    icon: HiOutlineCalendar,
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    cardBg: 'from-emerald-50 to-white',
    ring: 'ring-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  restorative: {
    icon: HiOutlineHeart,
    accent: 'text-rose-700',
    iconBg: 'bg-rose-100',
    cardBg: 'from-rose-50 to-white',
    ring: 'ring-rose-200/80',
    dot: 'bg-rose-500',
  },
  'email-groups': {
    icon: HiOutlineUserGroup,
    accent: 'text-orange-700',
    iconBg: 'bg-orange-100',
    cardBg: 'from-orange-50 to-white',
    ring: 'ring-orange-200/80',
    dot: 'bg-orange-500',
  },
};

const TRACK_META: Record<
  TrackTag,
  { label: string; chip: string; dot: string }
> = {
  mad: {
    label: 'M@D',
    chip: 'bg-orange-50 text-orange-800 border-orange-100',
    dot: 'bg-orange-500',
  },
  ayd: {
    label: 'AYD',
    chip: 'bg-blue-50 text-blue-800 border-blue-100',
    dot: 'bg-blue-500',
  },
  denternship: {
    label: 'Denternship',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  content: {
    label: 'Content',
    chip: 'bg-purple-50 text-purple-800 border-purple-100',
    dot: 'bg-purple-500',
  },
  general: {
    label: 'All staff',
    chip: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-500',
  },
};

const LINK_KIND_META: Record<
  LinkKind,
  { label: string; icon: IconType; iconBg: string; iconColor: string }
> = {
  drive: {
    label: 'Google Drive',
    icon: HiOutlineFolder,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  photos: {
    label: 'Google Photos',
    icon: HiOutlinePhotograph,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
  },
  calendar: {
    label: 'Google Calendar',
    icon: HiOutlineCalendar,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  docs: {
    label: 'Google Doc',
    icon: HiOutlineDocumentText,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
  },
  sheet: {
    label: 'Google Sheet',
    icon: HiOutlineTable,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
  },
  site: {
    label: 'Google Site',
    icon: HiOutlineDocumentText,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  form: {
    label: 'Form',
    icon: HiOutlineClipboardList,
    iconBg: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-700',
  },
  email: {
    label: 'Email group',
    icon: HiOutlineMail,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
  },
  link: {
    label: 'External link',
    icon: HiOutlineExternalLink,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
};

function getLinkKind(url: string): LinkKind {
  const lower = url.toLowerCase();
  if (lower.startsWith('mailto:')) return 'email';
  if (lower.includes('drive.google.com')) return 'drive';
  if (lower.includes('photos.app.goo.gl') || lower.includes('photos.google.com')) {
    return 'photos';
  }
  if (lower.includes('calendar.google.com')) return 'calendar';
  if (lower.includes('docs.google.com/spreadsheets') || lower.includes('/spreadsheets/')) {
    return 'sheet';
  }
  if (lower.includes('docs.google.com') || lower.includes('canva.link')) return 'docs';
  if (lower.includes('sites.google.com')) return 'site';
  if (lower.includes('airtable.com') || lower.includes('forms.')) return 'form';
  return 'link';
}

function getTrackTag(label: string, description?: string): TrackTag | null {
  const text = `${label} ${description ?? ''}`.toLowerCase();
  if (/\bm@d\b|made@dent/.test(text)) return 'mad';
  if (/\bayd\b|accelerate your dent/.test(text)) return 'ayd';
  if (/denternship/.test(text)) return 'denternship';
  if (/content|marketing/.test(text)) return 'content';
  if (/general staff|support-squad|all-staff/.test(text)) return 'general';
  return null;
}

function matchesQuery(link: KeyLinkItem, query: string): boolean {
  const haystack = [link.label, link.description ?? '', link.url]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function filterSections(sections: KeyLinkSection[], query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return sections;

  return sections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => matchesQuery(link, trimmed)),
    }))
    .filter((section) => section.links.length > 0);
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: IconType;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title="Copy email address"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-orange-700 transition hover:bg-orange-50"
    >
      <HiOutlineDuplicate className="h-3.5 w-3.5" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function TrackBadge({ track }: { track: TrackTag }) {
  const meta = TRACK_META[track];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function KeyLinkCard({ link }: { link: KeyLinkItem }) {
  const isActive = link.url.trim().length > 0;
  const isMailto = link.url.startsWith('mailto:');
  const email = isMailto ? link.url.replace(/^mailto:/, '') : '';
  const kind = isActive ? getLinkKind(link.url) : 'link';
  const kindMeta = LINK_KIND_META[kind];
  const KindIcon = kindMeta.icon;
  const track = getTrackTag(link.label, link.description);

  const cardClass =
    'group flex h-full items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md';

  if (!isActive) {
    return (
      <div className="flex h-full items-start gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100">
          <HiOutlineLink className="h-5 w-5 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-400">
            Coming soon
          </span>
          <p className="mt-2 font-medium text-gray-400">{link.label}</p>
          {link.description ? (
            <p className="mt-1 text-sm text-gray-400">{link.description}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const body = (
    <>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${kindMeta.iconBg}`}
      >
        <KindIcon className={`h-6 w-6 ${kindMeta.iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100">
            {kindMeta.label}
          </span>
          {track ? <TrackBadge track={track} /> : null}
        </div>

        <p className="font-semibold text-gray-900 transition-colors group-hover:text-orange-700">
          {isMailto ? (link.description ?? 'Email group') : link.label}
        </p>

        {!isMailto && link.description ? (
          <p className="mt-1 text-sm text-gray-500">{link.description}</p>
        ) : null}

        {isMailto ? (
          <p className="mt-2 truncate text-sm text-gray-500">{email}</p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
          {isMailto ? (
            <CopyEmailButton email={email} />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
              <HiOutlineExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (isMailto) {
    return (
      <a href={link.url} className={cardClass}>
        {body}
      </a>
    );
  }

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {body}
    </a>
  );
}

function groupLinksByDescription(links: KeyLinkItem[]) {
  const groups = new Map<string, KeyLinkItem[]>();
  for (const link of links) {
    const key = link.description?.trim() || 'Resources';
    const bucket = groups.get(key) ?? [];
    bucket.push(link);
    groups.set(key, bucket);
  }
  return Array.from(groups.entries());
}

function KeyLinkSectionPanel({ section }: { section: KeyLinkSection }) {
  const meta = SECTION_META[section.id] ?? {
    icon: HiOutlineLink,
    accent: 'text-gray-700',
    iconBg: 'bg-gray-100',
    cardBg: 'from-gray-50 to-white',
    ring: 'ring-gray-200/80',
    dot: 'bg-gray-400',
  };
  const SectionIcon = meta.icon;
  const isEmailSection = section.id === 'email-groups';
  const showSubgroups = section.id === 'onboarding' || section.id === 'email-groups';
  const activeCount = section.links.filter((link) => link.url.trim()).length;
  const subgroups = showSubgroups ? groupLinksByDescription(section.links) : null;

  const gridClass = isEmailSection
    ? 'grid grid-cols-1 gap-3 lg:grid-cols-2'
    : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3';

  return (
    <section
      id={section.id}
      className={`scroll-mt-28 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm ring-1 ${meta.ring}`}
    >
      <div
        className={`border-b border-gray-100 bg-gradient-to-r ${meta.cardBg} px-5 py-5 sm:px-6`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${meta.iconBg}`}
            >
              <SectionIcon className={`h-7 w-7 ${meta.accent}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              {section.description ? (
                <p className="mt-1 max-w-2xl text-sm text-gray-600">{section.description}</p>
              ) : null}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200">
            <SectionIcon className={`h-4 w-4 ${meta.accent}`} />
            {activeCount} {activeCount === 1 ? 'link' : 'links'}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {subgroups ? (
          <div className="space-y-6">
            {subgroups.map(([groupLabel, links]) => (
              <div key={groupLabel}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {groupLabel}
                  </h3>
                </div>
                <div className={gridClass}>
                  {links.map((link) => (
                    <KeyLinkCard key={link.label} link={link} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={gridClass}>
            {section.links.map((link) => (
              <KeyLinkCard key={link.label} link={link} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function KeyLinksPage() {
  const [query, setQuery] = useState('');
  const { role } = useBobAccess();
  const sections = useMemo(() => keyLinkSectionsForRole(role), [role]);
  const isStudent = role === 'student';

  const filteredSections = useMemo(
    () => filterSections(sections, query),
    [sections, query],
  );

  const totalLinks = useMemo(
    () => sections.reduce((sum, section) => sum + section.links.length, 0),
    [sections],
  );

  const activeLinks = useMemo(
    () =>
      sections.reduce(
        (sum, section) =>
          sum + section.links.filter((link) => link.url.trim()).length,
        0,
      ),
    [sections],
  );

  const isSearching = query.trim().length > 0;

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow={isStudent ? "Program resources" : "Staff resources"}
        title="Key Links"
        description={
          isStudent
            ? "Calendars, curriculum folders, photo albums, and wellness resources for your track."
            : "Your program hub for curriculum folders, photo albums, calendars, onboarding docs, wellness resources, and staff email groups."
        }
      />

      <div className="mb-8 overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={HiOutlineCollection}
              label="Sections"
              value={sections.length}
              iconBg="bg-orange-100"
              iconColor="text-orange-700"
            />
            <StatCard
              icon={HiOutlineLink}
              label="Resources"
              value={activeLinks}
              iconBg="bg-amber-100"
              iconColor="text-amber-700"
            />
            <StatCard
              icon={HiOutlineAcademicCap}
              label="Tracks covered"
              value={4}
              iconBg="bg-sky-100"
              iconColor="text-sky-700"
            />
          </div>

          <div className="w-full lg:max-w-md">
            <label htmlFor="key-links-search" className="sr-only">
              Search key links
            </label>
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="key-links-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search folders, albums, calendars, emails..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isSearching
                ? `${filteredSections.reduce((sum, section) => sum + section.links.length, 0)} matches`
                : `${totalLinks} resources across BoB '26`}
            </p>
          </div>
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <HiOutlineSearch className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">No matches found</p>
          <p className="mt-2 text-sm text-gray-500">
            Try searching by track, resource type, or email address.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <KeyLinkSectionPanel key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
