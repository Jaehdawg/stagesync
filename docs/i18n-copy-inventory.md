# StageSync copy inventory

Status: Phase 1 in progress

Goal: map every user-facing string to a single owner before extracting content into `content/en/*`.

## Proposed ownership map

### `content/en/shared.ts`
Shared labels and repeated UI copy.

Likely strings:
- Sign in / sign out
- Close / Save / Delete / Edit
- Search / Loading / Error / Success
- StageSync brand label variants
- repeated generic buttons and dialog labels

### `content/en/home.ts`
Homepage marketing copy.

Current homepage text:
- `StageSync`
- `Live band karaoke simplified.`
- `StageSync makes it easy for bands to manage the room while giving singers the thrill of being in the spotlight.`
- `Stage-friendly tools for fast, simple control`
- `Live singer queue management`
- `Less back-and-forth, more time performing`
- `A better experience for both the band and the crowd`
- `Learn more`
- `Band portal`
- `Need a singer sign-up link? Your band can generate one from the band dashboard.`

### `content/en/auth.ts`
Auth/login/signup copy.

Likely strings:
- Band login / Admin login / Singer Sign-up / Singer Login
- username/password labels and placeholders
- success and error messages
- role mismatch copy
- callback/auth status messages

### `content/en/singer.ts`
Singer-facing page and dashboard copy.

Likely strings:
- No active show yet
- signups open / paused / ended messages
- singer page headings
- queue headings
- lyrics/help labels
- band profile intro text
- empty states and request state copy

### `content/en/band.ts`
Band portal and dashboard copy.

Likely strings:
- Band portal / Band control / StageSync Band Dashboard
- show controls / queue management / song library
- singer signup link labels
- QR code labels
- start/pause/resume/end show labels
- band dashboard descriptions and helper copy

### `content/en/admin.ts`
Admin portal copy.

Likely strings:
- Platform control / StageSync Admin / StageSync Admin Login
- manage bands / user management / system analytics
- admin login help text
- admin dashboard section copy
- band profiles page copy

### `content/en/components/*.ts`
Reusable microcopy for shared UI widgets.

Targets:
- `band-access-form.ts`
- `singer-registration-form.ts`
- `song-request-form.ts`
- `tidal-search-panel.ts`
- `singer-current-request-card.ts`
- `song-lyrics-panel.ts`
- `admin-row-dialog.ts`
- `queue-action-buttons.ts`
- `auto-refresh.ts` if any labels are added later

## Files reviewed so far

- `app/page.tsx`
- `app/singer/page.tsx`
- `app/band/page.tsx`
- `app/admin/page.tsx`
- `components/band-access-form.tsx`
- `components/singer-registration-form.tsx`
- `components/song-request-form.tsx`
- `components/tidal-search-panel.tsx`
- `components/singer-current-request-card.tsx`
- `components/song-lyrics-panel.tsx`
- `components/band-dashboard-view.tsx`
- `components/dashboard-view.tsx`
- `components/admin-row-dialog.tsx`
- `components/queue-action-buttons.tsx`
- `components/auto-refresh.tsx`

## Notes

- Keep dynamic formatting in code.
- Keep route-level copy separate from reusable component copy.
- This inventory is intentionally a working draft; it is enough to start extraction and can be refined as we go.
