# StageSync Monetization Summary

## What’s done

### Closed epics / completed work
- **#40 Billing and account management UX**
  - Added a billing summary surface on the band account page.
  - Exposed plan, status, billing cycle, renewal timing, and remaining free-show state.
  - Added visible billing support routing.
  - Closed the issue and marked the roadmap project item done.

- **#55 Billing summary and account status UI**
  - Account page now clearly answers “what plan am I on?” and “what access do I have?”

- **#56 Payment method, invoices, and plan management**
  - Admin billing readiness surface exists.
  - Stripe readiness/config visibility is available.
  - Hosted checkout / portal / invoices URLs are exposed when configured.

- **#53 Professional product setup and entitlements**
  - Professional plan metadata exists as a first-class config.
  - Monthly-only labeling and feature highlights are in place.

- **#54 Professional subscription lifecycle and webhooks**
  - Stripe webhook signature verification is implemented.
  - Lifecycle sync handles checkout completion, subscription updates/deletes, and failed payments.

- **#43 Billing schema and entitlement resolver**
  - Canonical billing/entitlement helpers exist.
  - Billing state, credit ledger, and PCI-safe boundary scaffolding are in place.

- **#44 Show access window and free-show rules**
  - Free-show and paid-window helpers exist.
  - Undo/grace and duplicate-burn prevention rules are in code.

- **#42 Terms and conditions / terms of service** and **#58 Terms page and acceptance flow**
  - Terms page route and footer link are shipped.
  - Legal shell is in place.

- **#41 Analytics, event stream, and conversion reporting** / **#51 / #52**
  - Analytics schema and reporting surfaces exist.
  - Admin analytics dashboard and tracking-plan view are implemented.

- **#48–#50 Venue lead capture / provisioning / reporting**
  - Venue inquiry form and admin venue operations/reporting shells exist.
  - Venue lead routing and operator/provisioning concept surfaces are in place.

## Follow-up issues created from audit
These were split out from closed or partial work:
- **#59** — per-event credit checkout and receipt flows to real provider endpoints
- **#60** — hosted subscription billing actions to real provider flows
- **#61** — live Stripe dashboard config and webhook event coverage
- **#62** — provider-specific billing compliance notes and launch checklist
- **#63** — terms acceptance flow and launch visibility
- **#64** — analytics CSV export from daily rollups

## What should be done next

### Highest priority open epics
1. **#39 Venue license sales workflow**
   - Best next implementation target.
   - The open work is mostly the manual/high-touch venue sales path, provisioning, custom pricing, and reporting distinctions.

2. **#37 Professional subscription foundation**
   - Finish the real provider checkout / portal implementation and lifecycle wiring as needed.
   - The UX is present; the remaining work is the live provider path.

3. **#38 Per-event credit system and show access window**
   - Build the actual one-off credit purchase and show-pass behavior.
   - Connect the purchase path to the new follow-up tasks (#59) when implementing.

4. **#36 Monetization architecture, data model, and PCI boundary**
   - Keep this as the canonical foundation/architecture reference.
   - Use it to guide database and entitlement changes rather than treating it as a UX issue.

### Suggested order of execution
- Finish venue sales workflow first.
- Implement #59, #60, #61, and #64 alongside the relevant epics.
- Resolve #63 when finalizing the checkout/legal path.
- Treat #62 as the launch-readiness checklist for Stripe/provider setup.

## Current state
- The backlog is now decomposed into actionable pieces instead of hiding stubs inside closed epics.
- The remaining open epics are real roadmap items, not audit leftovers.
- The codebase is in a good place to move from audit mode into implementation mode.
