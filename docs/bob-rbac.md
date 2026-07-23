# BoB RBAC Architecture

Enterprise role-based access control for **Bet on Baltimore** (Dent Ops), aligned with the FY26 ops whiteboard.

## Roles & scopes

| Role | Whiteboard | Scope | Access summary |
|------|------------|--------|----------------|
| **Admin** | Leadership | Organization | Full program data, settings, sync, reports |
| **Program Manager** | Leadership | Organization | Roster, intake, tracks, attendance, deliverables |
| **Site Supporter** | Support Squad | Assigned tracks (up to 2) for Command Center / attendance / My Track; **full org roster** | All except intake; deliverables, blitz, roster, incidents. Weekly check-in: everyone. |
| **Fellow** | Support Squad | Same as site supporter | Same permissions as site supporter (`bobRole: fellow` → `site_supporter`). Weekly check-in: everyone (same as site supporter). |
| **Coach** | Coaches | Assigned track(s) for dashboard / attendance / My Track; **full org roster (view)** | Dashboard + **My Track** workspace; deliverables & attendance for their track; weekly check-in: Blitz team youth (fallback: track). No intake or track admin list. |
| **Summer Staff** | Summer Staff | Organization (view) | **Roster view** (+ dashboard, attendance, deliverables view). **No roster edit** — edit reserved for leadership / Support Squad. |
| **Student** | Students | Self | Own profile, submit forms, limited dashboard; no staff notes or org inbox |

**Roster (35A):** Coaches and Site Supporters / Fellows see the **full** operational roster in `/app/bob/roster`. Track scope still applies to Command Center KPIs, attendance marking, wellness, and My Track.

## Permission matrix (whiteboard)

### Leadership (`admin`, `program_manager`)
- **All** areas including intake, settings (admin only), staff directory, org-wide reports

### Support Squad (`site_supporter`, `fellow`)
- ✅ **Command Center** — default view scoped to assigned tracks (up to 2)
- ✅ **Attendance** — mark attendance, submit reports, attendance correction triage
- ✅ **Deliverables** — view and review/edit team submissions (`milestones.edit`)
- ✅ **Blitz points** — accountability widgets on command center (blitz teams leaderboard)
- ✅ **Roster** — view and edit the **full** program roster (35A; Command Center stays track-scoped)
- ✅ **Incidents** — operations inbox for responding to incidents
- ✅ **Submit** — operational forms
- ✅ **Key Links** — full staff resource hub
- ✅ **Tracks** (`pods.view`) — oversee assigned tracks (not org-wide track admin)
- ❌ **Intake** pipeline (`intake.view`, `intake.edit`)
- ❌ **Track assignment** / create (`pods.edit`, `pods.create`)
- ❌ Program reports tab, settings, staff directory

### Coaches (`coach`)
- ✅ Dashboard (1 track), **full roster view** (35A), attendance, deliverables (view), submit, incidents
- ❌ Roster **edit** (edit reserved for leadership / Support Squad)
- ❌ Intake pipeline
- ❌ Track assignment (`pods.edit`, `pods.create`, `pods.view` list)
- ❌ Blitz / weekly deliverable accountability widgets (support squad only)
- ❌ Attendance discrepancy triage (support squad)

### Summer Staff (`summer_staff`)
- ✅ **Roster view** (org-wide) — primary ask for ticket #33
- ✅ Dashboard, attendance mark, deliverables view, submit, key links
- ❌ Roster **edit**, intake, track admin, settings, staff directory

### Students (`student`)
- ✅ **Personal dashboard** — attendance %, deliverables submitted & completed, project team, blitz points (scoped to linked student)
- ✅ **Roster** — view-only cohort gallery; edit own profile only; no peer PII or stats
- ✅ **Attendance** — personal view + **self-service correction** (absence / punch fixes via `/app/bob/attendance/correction`); cannot mark or edit attendance records
- ✅ **Deliverables** — project team and track deliverables filtered to student scope
- ✅ **My submissions** — own form activity only (`submissions.viewOwn`); no org inbox or staff notes
- ✅ **Submit** — youth forms (progress, testimony, feedback) plus reimbursement; no other staff request forms
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

Run `npm run seed:bob-staff` from `dent-be` to sync the BoB '26 staff roster.

- Admin roster users keep **Google sign-in** with their `@denteducation.org` account.
- Non-admin roster users get **Firebase email/password** login with the default password `BobTest2026!` unless overridden by `BOB_STAFF_SEED_PASSWORD`.
- Use `npm run seed:bob-staff:auth` to provision only Firebase password users for non-admin staff.
- Use `npm run seed:bob-staff:mongo` to skip Firebase and only sync Mongo + pod assignments.
- To reset passwords for **existing** Firebase users, set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` (Firebase service account JSON) and re-run `npm run seed:bob-staff:auth`.

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
