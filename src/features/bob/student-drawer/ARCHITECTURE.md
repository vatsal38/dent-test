# Student Detail Drawer — Architecture

Operational CRM-style student command center for Dent Ops BoB. Usable from any BoB route via URL or imperative API.

## Goals

- Right-side drawer (640–780px) — not a raw DB detail screen
- Persistent tab preference (session) + shareable tab state (URL)
- Lazy-loaded tab panels; shell/header loads immediately
- TanStack Query caching with tab-scoped fetch enablement

## Mounting

`StudentDrawerHost` is mounted once in `app/app/bob/layout.tsx` inside `<Suspense>`.

```tsx
<Suspense fallback={null}>
  <StudentDrawerHost />
</Suspense>
```

## URL contract

| Param | Meaning |
|-------|---------|
| `id` | Mongo student id (canonical) |
| `student` | Legacy alias (milestones/interview links) |
| `tab` | One of: `overview`, `attendance`, `milestones`, `notes`, `incidents`, `journey`, `onboarding`, `demographics`, `activity` |

Example: `/app/bob/roster?id=64f…&tab=incidents&queue=active`

### Opening from code

```tsx
const { openStudent, closeStudent, setTab } = useStudentDrawerUrl();
openStudent(studentId, "attendance");
```

## State layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Open/close + tab | `useSearchParams` + `router.push` | Shareable links, back button |
| Last tab (no `tab` in URL) | `sessionStorage` key `bob:student-drawer:last-tab` | Return visits feel continuous |
| Student shell | `useBobStudentDetail` | Header, wellness, ratings |
| Tab data | `useStudentTabQueries` | Fetch only when tab (or overview) needs it |

## Caching

- **Detail**: `bobKeys.students.detail(id)`, `staleTime: 30s`, `placeholderData` for smooth student switches
- **Attendance**: `bobKeys.students.attendance(id, range)` — 42-day window
- **Submissions**: `bobKeys.students.submissions(id)` — 60s refetch on active tabs
- **Milestones**: `bobKeys.students.milestones(id)` — filtered client-side by `ownerId` / `scopeId`
- **Onboarding**: `bobKeys.students.onboarding(id)` — only when onboarding/journey tab active

## Lazy loading

Tab panels are `next/dynamic` imports in `tabs/lazyTabPanels.tsx`. Only the active panel chunk loads.

## Composition

```
StudentCommandDrawer
├── StudentDrawerHeader     (avatar, badges, wellness strip, rating, quick actions)
├── StudentDrawerTabs       (horizontal scroll nav)
└── StudentDrawerTabPanel   (lazy panel)
    ├── OverviewTab         KPI cards + summary + activity preview
    ├── AttendanceTab       6-week history
    ├── MilestonesTab       student-scoped milestones
    ├── NotesTab            Airtable coach notes + submission narrative
    ├── IncidentsTab        incidents + wellness checks
    ├── JourneyTab          pipeline + onboarding progress
    ├── OnboardingTab       checklist API
    ├── DemographicsTab     grouped Airtable fields
    └── ActivityTab         unified timeline
```

## Reusable widgets

Export from `@/features/bob/student-drawer`:

- `DetailCard` / `DetailCardGrid`
- `WellnessIndicator` / `WellnessStrip`
- `RatingBar` (engagement score from operational signals)
- `CoachNoteCard`
- `ActivityTimeline`

## Signals (client-side)

`lib/profileSignals.ts` derives wellness indicators and 1–5 engagement rating from attendance stats, open submissions, and milestone progress — display-only, not persisted.

## RBAC

Respect existing BoB student scope on API (`getStudent` coach scope). Drawer does not bypass backend checks.

## Migration

- `StudentDetailDrawer` re-exports `StudentCommandDrawer` for controlled usage
- Prefer global host + `useStudentDrawerUrl` on list pages to avoid duplicate drawers
