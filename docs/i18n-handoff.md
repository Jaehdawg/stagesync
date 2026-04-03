# StageSync i18n handoff

## Current state

The StageSync copy extraction is now centralized under `content/en/`.

### What is already in place

- Shared copy: `content/en/shared.ts`
- Route copy:
  - `content/en/home.ts`
  - `content/en/auth.ts`
  - `content/en/singer.ts`
  - `content/en/band.ts`
  - `content/en/admin.ts`
- Component copy:
  - `content/en/components/band-access-form.ts`
  - `content/en/components/singer-registration-form.ts`
  - `content/en/components/band-dashboard-view.ts`
  - `content/en/components/singer-dashboard-view.ts`
  - `content/en/components/tidal-search-panel.ts`
  - `content/en/components/singer-current-request-card.ts`
  - `content/en/components/song-lyrics-panel.ts`

### Recent cleanup

- Admin users/bands pages now use `adminCopy` for the remaining visible labels and helper text.
- Added a focused test in `content/en/admin.test.ts` to pin the centralized admin copy shape.
- `npm run build` passes after the copy extraction changes.

## Next i18n step

Continue the same pattern for any remaining user-facing text that still lives in route or component files, then repeat the structure for future locale folders under `content/`.

## Handy validation

Run these after copy changes:

```bash
npm run build
npm test -- content/en/admin.test.ts
```

## Resume rule

If another contributor picks this up, they should:

1. read `docs/i18n-content-structure.md`
2. read this handoff note
3. check the `content/en/` tree before editing route or component files
