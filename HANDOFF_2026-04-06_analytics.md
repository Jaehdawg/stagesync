# StageSync Handoff — 2026-04-06

## What was completed
- Closed GitHub issue **#41: Analytics, event stream, and conversion reporting**.
- Pushed commit **`1e3798c`** (`Add analytics event stream`).
- Added the canonical analytics event stream layer:
  - `lib/analytics-events.ts`
  - `app/api/analytics/track/route.ts`
  - `app/api/analytics/redirect/route.ts`
  - `components/analytics-page-view.tsx`
- Expanded the analytics schema in `lib/analytics-schema.ts` to cover:
  - pricing page views and CTA clicks
  - trial starts
  - show creation / show lifecycle events
  - queue song requests
  - venue lead page views / conversions
  - subscription starts / churns
- Instrumented key monetization and usage flows to emit analytics events:
  - homepage pricing / trial redirects
  - per-event purchase start
  - subscription start / churn
  - show creation and show lifecycle transitions
  - queue song requests
  - venue lead submissions
- Added client-side page-view tracking on:
  - homepage pricing section
  - venue sales page

## Validation
Passed:
- `npx vitest run lib/analytics-schema.test.ts lib/analytics-events.test.ts components/homepage-landing.test.tsx app/api/analytics/track/route.test.ts app/api/analytics/redirect/route.test.ts app/api/billing/credits/route.test.ts app/api/billing/subscription/route.test.ts app/api/billing/webhook/route.test.ts app/api/shows/route.test.ts app/api/shows/[id]/state/route.test.ts app/api/queue/route.test.ts app/api/venues/leads/route.test.ts app/venues/page.test.tsx`
- `npx tsc --noEmit --pretty false`

## Important implementation notes
- Analytics writes are fire-and-forget so they do not block billing, show control, or lead capture flows.
- Billing and analytics remain separate:
  - billing data stays in billing tables / billing-resolver logic
  - analytics data goes through `analytics_events`
- Public click-throughs are routed through `/api/analytics/redirect` so conversion steps are measurable without changing destination pages.

## Files most likely to matter next
- `app/api/analytics/track/route.ts`
- `app/api/analytics/redirect/route.ts`
- `lib/analytics-events.ts`
- `lib/analytics-schema.ts`
- `components/homepage-landing.tsx`
- `app/venues/page.tsx`
- `app/api/venues/leads/route.ts`

## Current roadmap / next issue
- Next open issue after this slice is **#40: Billing and account management UX**.
- That should likely build on the billing pages, account screens, and the new analytics hooks.

## Status to carry forward
- Repo is pushed.
- Worktree was clean at the end of the slice.
- If the GitHub project card for #41 needs a final manual check, do that first before starting #40.
