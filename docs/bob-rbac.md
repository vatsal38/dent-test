# BoB RBAC Architecture

Enterprise role-based access control for **Bet on Baltimore** (Dent Ops).

## Roles & scopes

| Role | Scope | Typical visibility |
|------|--------|-------------------|
| **Admin** | Organization | Full program data, settings, sync, reports |
| **Program Manager** | Organization | Roster, intake, pods, attendance, milestones (no admin settings) |
| **Site Supporter** | Site / assigned pods | Attendance, discrepancies, site roster & incidents |
| **Coach** | Pod | My pod, pod students, pod milestones, assigned notifications |

Scopes are enforced **server-side** via `dent-be/lib/bobCoachScope.js` (`coachIdsFilter` on lists) and **client-side** via `scopedFilters.ts` for UI consistency.

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
| `scopedFilters.ts` | Client pod/site filtering |
| `routes.ts` / `navConfig.ts` | Declarative route & nav rules |

## Patterns

### Page feature

```tsx
const { can, access, defaultPodId } = useBobAccess();
if (!can("attendance.mark")) return <UnauthorizedState />;
```

### Action button

```tsx
<BobPermissionGuard permission="pods.create" silent>
  <CreatePodLink />
</BobPermissionGuard>
```

### Scoped query defaults

```tsx
const { defaultPodId, siteFilterOptions } = useBobAccess();
const [podFilter, setPodFilter] = useState(defaultPodId);
```

Backend list endpoints already apply coach scope when the session user is not admin/program manager.

## Dent Ops (admin only)

Partnerships, Email, Runs, and `/app` home are **platform admin only** (`user.isAdmin` from bootstrap).

- UI: `DentOpsRouteGuard` in `app/app/layout.tsx` — redirects others to BoB home
- Sidebar: Dent Ops section hidden for non-admins
- API: `/api/education/*` and `/api/integrations/*` (except Gmail OAuth callback) require `requireAdmin`

## URL protection (BoB)

All `/app/bob/*` routes are wrapped by `BobRouteGuard` in `app/app/bob/layout.tsx`:

- Matches path → required permission via `routes.ts` (`BOB_ROUTES`)
- **Does not render** page content until access is confirmed
- **Redirects** to role-appropriate home (e.g. coach → My Pod, site supporter → Attendance)

Direct navigation examples:

| URL | Coach | Site supporter |
|-----|-------|----------------|
| `/app/bob/settings` | Redirect | Redirect |
| `/app/bob/pods` | Redirect | Redirect |
| `/app/bob/recruitment` | Redirect | Redirect |
| `/app/bob/my-pod` | Allowed | Redirect |
| `/app/bob/attendance` | Redirect | Allowed |

API routes enforce the same boundaries (e.g. recruitment → 403 for coach/site roles).

## Middleware

- **Edge** (`middleware.ts`): tags BoB routes; auth is Firebase client-side.
- **Client** (`BobRouteGuard`): permission check from `/api/bob/me`.

## Scaling

- **ABAC**: extend `resolveBobAccess` with resource attributes; keep `can()` API stable.
- **Server permissions array**: optional `permissions[]` on `/me` for dynamic grants.
- **Feature flags**: compose with `can()` — `can('x') && flags.y`.

## Legacy

`bobCapabilities()` and `bobRole` on `/me` remain for gradual migration. Prefer `useBobAccess().can()`.

## Local test accounts

From `dent-be`, run:

```bash
npm run seed:bob-rbac:mongo   # Mongo users + BoB pods/students
npm run seed:bob-rbac:auth    # Firebase email/password users (required for /login)
```

Or full seed: `npm run seed:bob-rbac` (uses Admin SDK, or REST fallback if credentials are missing).

Requires `MONGODB_URI` and Firebase **Email/Password** sign-in enabled in Console.

| Role | Email | Password |
|------|--------|----------|
| Admin | `bob.admin@dent.test` | `BobTest2026!` |
| Program Manager | `bob.pm@dent.test` | `BobTest2026!` |
| Site Supporter | `bob.site@dent.test` | `BobTest2026!` |
| Coach | `bob.coach@dent.test` | `BobTest2026!` |

Override password: `BOB_SEED_PASSWORD=YourSecret npm run seed:bob-rbac`

On the login page (dev only), expand **BoB test accounts** to autofill email and password.

**Seed data:** Pod Falcon (coach + site supporter, Northwest), Pod Harbor (site supporter only, Eastside), four students, sample attendance.
