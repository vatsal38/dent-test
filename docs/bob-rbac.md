# BoB RBAC Architecture

Enterprise role-based access control for **Bet on Baltimore** (Dent Ops), aligned with the FY26 ops whiteboard.

## Roles & scopes

| Role | Whiteboard | Scope | Access summary |
|------|------------|--------|----------------|
| **Admin** | Leadership | Organization | Full program data, settings, sync, reports |
| **Program Manager** | Leadership | Organization | Roster, intake, tracks, attendance, deliverables |
| **Site Supporter** | Support Squad | Assigned tracks (up to 2) | All except intake; deliverables, blitz, roster, incidents |
| **Fellow** | Support Squad | Assigned tracks | Same permissions as site supporter (`bobRole: fellow` → `site_supporter`) |
| **Coach** | Coaches | 1 track | Deliverables & attendance for their track; no intake or track assignment |
| **Student** | Students | Self | Own profile, submit forms, limited dashboard; no staff notes or org inbox |

Scopes are enforced **server-side** via `dent-be/lib/bobCoachScope.js` and **client-side** via `useBobAccess()` / route guards.

## Permission matrix (whiteboard)

### Leadership (`admin`, `program_manager`)
- **All** areas including intake, settings (admin only), staff directory, org-wide reports

### Support Squad (`site_supporter`, `fellow`)
- ✅ **Command Center** — default view scoped to assigned tracks (up to 2)
- ✅ **Attendance** — mark attendance, submit reports, attendance correction triage
- ✅ **Deliverables** — view and review/edit team submissions (`milestones.edit`)
- ✅ **Blitz points** — accountability widgets on command center (blitz teams leaderboard)
- ✅ **Roster** — view and edit students on assigned tracks
- ✅ **Incidents** — operations inbox for responding to incidents
- ✅ **Submit** — operational forms
- ✅ **Key Links** — full staff resource hub
- ✅ **Tracks** (`pods.view`) — oversee assigned tracks (not org-wide track admin)
- ❌ **Intake** pipeline (`intake.view`, `intake.edit`)
- ❌ **Track assignment** / create (`pods.edit`, `pods.create`)
- ❌ Program reports tab, settings, staff directory

### Coaches (`coach`)
- ✅ Dashboard (1 track), roster, attendance, deliverables (view), submit, incidents
- ❌ Intake pipeline
- ❌ Track assignment (`pods.edit`, `pods.create`, `pods.view` list)
- ❌ Blitz / weekly deliverable accountability widgets (support squad only)
- ❌ Attendance discrepancy triage (support squad)

### Students (`student`)
- ✅ **Personal dashboard** — attendance %, deliverables submitted & completed, project team, blitz points (scoped to linked student)
- ✅ **Roster** — view-only cohort gallery; edit own profile only; no peer PII or stats
- ✅ **Attendance** — personal read-only view; cannot mark or edit attendance
- ✅ **Deliverables** — project team and track deliverables filtered to student scope
- ✅ **My submissions** — own form activity only (`submissions.viewOwn`); no org inbox or staff notes
- ✅ **Submit** — youth forms only (progress, testimony, feedback); no staff request forms
- ✅ **Key Links** — youth-facing calendars, curriculum, photos, Dentie.ai tools, wellness resources
- ❌ **Submissions inbox** — no other students’ submissions (`inbox.view`)
- ❌ **Staff notes** (`notes.viewStaff`)
- ❌ Intake, tracks admin, settings, staff directory

## Layered model

```
GET /api/bob/me  →  resolveBobAccess()  →  ROLE_PERMISSIONS matrix
                              ↓
        useBobAccess() / BobPermissionGuard / BobRouteGuard / navConfig
```

### Adding a permission

1. Add key to `src/platform/rbac/permissions.ts` (`BOB_PERMISSIONS`).
2. Grant it in `ROLE_PERMISSIONS` for relevant roles.
3. Gate UI with `<BobPermissionGuard permission="…">` or `can("…")`.
4. If route-level, add to `routes.ts` and `navConfig.ts`.
5. Enforce on API in `dent-be` (never rely on UI alone).

## Key modules

| Module | Purpose |
|--------|---------|
| `permissions.ts` | Permission IDs + static role matrix |
| `resolveBobAccess.ts` | `BobAccessContext` + `canAccess()` |
| `useBobAccess.ts` | Hook: `can`, `access`, scoped defaults |
| `BobRouteGuard` | Route → permission (`app/bob/layout.tsx`) |
| `BobPermissionGuard` | Component-level gates (actions, drawers, widgets) |
| `routes.ts` / `navConfig.ts` | Declarative route & nav rules |

## Staff roster seeding

Run `npm run seed:bob-staff` from `dent-be` to sync Mongo users from the BoB '26 staff roster:

| Airtable role | Platform `bobRole` | Ops role |
|---------------|-------------------|----------|
| CEO, admins | `admin` | Leadership |
| BoB '26 Coach | `coach` | Coach |
| BoB '26 Site Supporter | `site_supporter` | Support Squad |
| BoB '26 Fellow | `site_supporter` | Support Squad |
| Program staff | `program_manager` | Leadership |

## Local test accounts

```bash
npm run seed:bob-rbac:mongo
npm run seed:bob-rbac:auth
```

| Role | Email | Password |
|------|--------|----------|
| Admin | `bob.admin@dent.test` | `BobTest2026!` |
| Program Manager | `bob.pm@dent.test` | `BobTest2026!` |
| Site Supporter | `bob.site@dent.test` | `BobTest2026!` |
| Coach | `bob.coach@dent.test` | `BobTest2026!` |
| Student (demo) | `demo.student@dent.test` via **Student** demo button | Auto-links to richest active roster youth |
