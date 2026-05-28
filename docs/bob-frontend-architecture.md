# BoB Frontend Architecture

Living reference for the Dent Ops **Bet on Baltimore** UI redesign.

## Stack

- Next.js 16 App Router (`dent-fe`)
- React 19 + TypeScript + Tailwind 4
- TanStack Query v5 (server state)
- Firebase Auth (session → `apiRequest`)

## Directory layout

```
src/
├── platform/           # Cross-cutting infrastructure
│   ├── api/            # HTTP client + domain modules
│   │   ├── client.ts
│   │   └── bob/        # BoB API (split from monolithic api.ts)
│   └── query/          # React Query provider, keys, hooks
├── design-system/      # Domain-agnostic UI primitives & patterns
├── features/bob/       # BoB-specific composed UI
└── lib/                # Legacy barrel (api.ts re-exports bob)
```

## API compatibility

All BoB calls remain under `/api/bob/*`. Existing imports from `@/lib/api` continue to work via re-export from `@/platform/api/bob`.

Endpoints used across phases:

- `GET /api/bob/airtable/status` · `POST /api/bob/airtable/sync`
- `GET /api/bob/me` — role, coach scope, primary pod (Phase 3)
- Coach-scoped lists/stats when session user is not a program director

## Phase roadmap

| Phase | Focus | Status |
|-------|--------|--------|
| 0 | Platform layer, Query, design tokens, sync badge, dashboard KPIs | Done |
| 1 | Inbox queues, curated table, detail drawer (`?queue=&id=`) | Done |
| 2 | Roster queues + drawer, operations hub, coach my-pod | Done |
| 3 | Settings, role-based home, backend coach filter, reports merge | Done |
| 4 | Thin routes, `features/bob` for ops pages, React Query hooks | Done |

## Conventions

- **Pages** in `app/` are thin; logic lives in `features/bob`.
- **Mutations** that touch Airtable (transfer, approve, delete) are not optimistic.
- **List filters** use API `filters` JSON string unchanged.
- **Status badges** use `@/design-system/tokens/status`.

### Phase 4 surfaces (`features/bob`)

- `attendance/` — grid, mark, discrepancies + `weekDates`
- `pods/` — list, create, detail
- `staff/`, `milestones/`, `interview/`, `submit/`

Hooks: `useBobAttendance`, `useBobMilestones`, extended `useBobPods` / `useBobStudents`.

Shared `lib/bob*` filter helpers remain on `@/lib/api` types (used by inbox/roster tables).

### RBAC

See [bob-rbac.md](./bob-rbac.md). Use `useBobAccess().can('permission.id')` and `BobPermissionGuard` — avoid inline role checks.

### Follow-ups

- Persist explicit `role` on user records in Mongo; notification targeting by role
