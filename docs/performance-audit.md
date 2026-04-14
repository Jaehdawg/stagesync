# StageSync Performance Audit

Last reviewed: 2026-04-14

This is the lightweight performance map for StageSync, meant to help another agent or developer quickly find the biggest wins.

## Baseline measurement

Use these before/after checks when landing perf work:

```bash
npm run build
npm run test
npm run lint
```

For route/query hotspots, use targeted tests plus a quick build pass. For bundle work, compare the Next build output and the size of the main client islands after the change.

## Current hotspot list

### 1. Singer dashboard client island, high impact

**File:** `components/singer-dashboard-view.tsx`

Why it matters:
- The singer page pulls registration, Tidal search, lyrics, queue, and request state into one large client component.
- That makes the initial singer experience heavier than it needs to be on show-night mobile devices.

Best next fix:
- Split search and lyrics into lazy-loaded client chunks, or isolate the parts that only render when needed.

Suggested child issue:
- `Performance: split singer dashboard into lazy-loaded islands`

### 2. Admin analytics fan-out, medium impact

**File:** `app/admin/analytics/page.tsx`

Why it matters:
- The page performs several count queries and a recent-show query on every request.
- It is already parallelized, but it still does a lot of work for a read-only dashboard.

Best next fix:
- Move stable numbers to rollup-backed summaries or a single admin analytics summary query.
- Add caching where the data is not expected to change every request.

Suggested child issue:
- `Performance: collapse admin analytics counts into a summary query`

### 3. Public singer search path, medium impact

**Files:** `app/api/songs/search/route.ts`, `components/tidal-search-panel.tsx`

Why it matters:
- This path is called frequently while singers search live.
- It benefits from query sanitation, index support, and avoiding repeated work.

Status:
- Query sanitation and hot-path indexes were already added in the security/perf work.
- Keep an eye on Tidal catalog auth/token work if usage grows.

### 4. Queue request path, medium impact, already improved

**File:** `app/api/queue/route.ts`

Why it matters:
- This route used to do sequential show/request lookups.
- It is a high-traffic singer action during shows.

Status:
- The main lookup fan-out was already reduced and the supporting indexes were added.

### 5. Analytics export path, low-to-medium impact

**File:** `app/api/admin/analytics/export/route.ts`

Why it matters:
- Export is read-only and rollup-backed, but it is still a path worth watching if the rollup table grows large.

Best next fix:
- Keep exports backed by rollups and avoid switching to raw-event scans.

## Follow-on work to watch

- Bundle analysis for the singer dashboard and admin screens
- Query consolidation for read-only dashboards
- Cacheability of public, read-only responses
- Any route that repeats auth checks or band lookups across the same request
