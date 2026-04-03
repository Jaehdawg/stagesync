# StageSync content structure

## Goal

Move all user-facing copy into a dedicated content tree so the app is easy to edit now and easy to localize later.

## Proposed tree

```txt
content/
  en/
    shared.ts
    home.ts
    auth.ts
    singer.ts
    band.ts
    admin.ts
    components/
      band-access-form.ts
      singer-registration-form.ts
      song-request-form.ts
      tidal-search-panel.ts
      singer-current-request-card.ts
      song-lyrics-panel.ts
      admin-row-dialog.ts
      queue-action-buttons.ts
      auto-refresh.ts
```

## Conventions

### 1) Route copy stays in route files
Use page-level content modules for page headings, descriptions, CTA text, and empty states.

Examples:
- home hero copy → `content/en/home.ts`
- singer page copy → `content/en/singer.ts`
- band page copy → `content/en/band.ts`
- admin page copy → `content/en/admin.ts`

### 2) Reusable widget copy stays in component content files
Put labels, placeholders, button text, dialog titles, and validation messages for shared components into `content/en/components/*`.

### 3) Keep dynamic formatting in code
Do not move business logic, counts, or formatting helpers into content files.

Examples:
- `${artist} — ${title}` formatting
- queue counts
- pagination text assembled from numbers
- active/inactive status decisions

### 4) Use typed exports
Each content module should export a typed object with stable keys.

Example:
```ts
export const homeCopy = {
  headline: 'Live band karaoke simplified.',
  subhead: 'StageSync makes it easy for bands to manage the room while giving singers the thrill of being in the spotlight.',
} as const
```

### 5) Keep shared strings centralized
Common labels like Sign in, Log out, Close, Save, Edit, Delete, Search, and generic errors should live in `shared.ts`.

## Suggested order of extraction

1. `content/en/shared.ts`
2. `content/en/home.ts`
3. `content/en/auth.ts`
4. `content/en/components/*`
5. `content/en/singer.ts`
6. `content/en/band.ts`
7. `content/en/admin.ts`

## Handoff rule

If work is paused or handed off, the next contributor should be able to:
- read this doc
- read the inventory doc
- know which file owns each string
- continue extraction without re-deciding structure
