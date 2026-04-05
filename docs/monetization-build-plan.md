# StageSync Monetization Build Plan

## Objective
Turn the monetization roadmap into code-ready work without losing the product rules we just decided:
- credits and access are owned at the **account** level
- each band gets **3 free shows**
- a paid show access window lasts **24 hours from show start**
- repeated start/stop inside the same paid window should **not** consume extra credits
- payments must stay outside StageSync's PCI boundary by using a hosted payment provider
- terms and conditions must exist before live payment flows

## Primary delivery order

### 1) Legal first
**Project items:** #42, #57, #58

Why this comes first:
- paid flows should not ship without visible terms
- the terms page/acceptance flow is a prerequisite for checkout UX

Code-ready starting points:
- `app/terms/page.tsx` or equivalent terms route
- footer link in the marketing shell
- acceptance banner/checkbox only where the flow truly needs it

### 2) Monetization foundation
**Project items:** #36, #43, #44, #45

Why this comes first:
- every paid path depends on a single source of truth for billing state
- PCI boundaries must be explicit before payment integration begins

Code-ready starting points:
- new billing types/helpers in `lib/`
- new Supabase migration for billing tables / entitlements / credit ledger
- server-side payment boundary helper
- webhook verification scaffolding

Core decisions locked in:
- account-level ownership
- 3 free shows per band
- 24-hour post-start expiration for paid shows

### 3) Per-event credits
**Project items:** #38, #46, #47

Why this is next:
- per-event is the first revenue path and the easiest to validate
- it gives a simple price point for occasional users

Code-ready starting points:
- credit purchase flow
- show access window state machine
- undo grace period for accidental start/stop
- queue/show lifecycle guards so duplicate charges cannot happen

### 4) Professional subscription
**Project items:** #37, #53, #54

Why this is after the foundation:
- recurring billing needs the same entitlement layer as per-event
- Professional should upgrade from the free/credit flow cleanly

Code-ready starting points:
- product/price config
- subscription checkout
- webhook-driven subscription state sync
- plan status display in the account area

### 5) Billing UX
**Project items:** #40, #55, #56

Why this is after billing exists:
- account pages should reflect real state, not guessed state
- users need self-serve access to invoices and payment methods

Code-ready starting points:
- billing summary page
- plan/access status components
- payment method and invoice management entry points
- cancellation / grace-period messaging

### 6) Analytics and reporting
**Project items:** #41, #51, #52

Why this is parallelizable later:
- analytics should reflect the final funnel and event names
- the data model depends on the monetization shape being stable

Code-ready starting points:
- canonical analytics event schema
- funnel tracking hooks
- product usage events for band/singer behavior
- durable storage and report-ready event payloads

### 7) Venue license workflow
**Project items:** #39, #48, #49, #50

Why this is last:
- venue sales are high-touch and should not block self-serve revenue
- the venue path depends on billing, reporting, and account structure

Code-ready starting points:
- venue lead capture
- admin provisioning workflow
- venue-level reporting fields
- custom pricing / discount assignment

## Build rules
- Do not hardcode plan logic in the UI if it can live in a shared helper.
- Do not store card data in StageSync.
- Do not ship payment flows before the terms flow exists.
- Do not make venue logic leak into the self-serve band flow.
- Track every major monetization step with analytics.

## Suggested first sprint
If an implementation agent starts tomorrow, the order should be:
1. Implement the legal pages (#42, #57, #58)
2. Add the billing schema and entitlement helper (#36, #43, #44, #45)
3. Wire the 3-free-show band rule and 24-hour access window (#38, #46, #47)
4. Wire one payment provider integration behind hosted checkout
5. Add a minimal billing status page

## Definition of done for the first release
- A band can use 3 free shows
- A band can buy a per-event credit
- A paid show expires 24 hours after start
- The app knows the current plan/account status
- Terms are visible before payment
- Payment data stays outside the app
