# StageSync

StageSync is a Next.js app for live show song requests.

## What it does

- **Singer flow**: register, search songs, queue requests, see lyrics, and view custom band links/messages.
- **Band flow**: manage shows, queue, members, songs, set lists, billing, and band profile data.
- **Admin flow**: manage bands, users, analytics, and venue-related data.
- **Integrations**: Supabase, Tidal, Stripe, and PWA/service worker support via `next-pwa`.

## Tech stack

- Next.js 16 (App Router)
- React 19
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Stripe
- Vitest + Testing Library
- Playwright for e2e tests
- ESLint + TypeScript
- `next-pwa` for service worker / offline support

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build production locally:

```bash
npm run build
npm run start
```

Notes:

- The production build uses `next build --webpack` because `next-pwa` is wired into the Webpack path.
- Builds may generate `public/sw.js` and `public/workbox-*.js`; these are ignored.

## Tests

Unit / component / route tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Lint:

```bash
npm run lint
```

End-to-end tests:

```bash
npm run test:e2e
```

Useful targeted checks:

```bash
npx vitest run app/api/songs/search/route.test.ts
npx eslint app/api/songs/search/route.ts
```

## Dependencies

### Runtime

- `next`
- `react`
- `react-dom`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `stripe`

### Dev / build

- `eslint`
- `eslint-config-next`
- `typescript`
- `vitest`
- `@vitejs/plugin-react`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@playwright/test`
- `tailwindcss`
- `@tailwindcss/postcss`
- `next-pwa`
- `vite`

Overrides in `package.json` pin:

- `lodash` to `4.18.1`
- `serialize-javascript` to `7.0.5`

## Environment variables

### Required for most app access

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase service access

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (fallback for service client, if used)
- `SUPABASE_SECRET_KEY` (fallback for some Tidal credential encryption paths)

### Tidal

- `TIDAL_CLIENT_ID`
- `TIDAL_CLIENT_SECRET`
- `TIDAL_API_BASE_URL` (optional)
- `TIDAL_BROWSER_TOKEN` (optional, if the app supports browser token auth in your environment)
- `TIDAL_CREDENTIALS_ENCRYPTION_KEY` (preferred for encrypted stored credentials)

### Stripe / billing

- `STAGESYNC_BILLING_CHECKOUT_URL`
- `STAGESYNC_BILLING_PORTAL_URL`
- `STAGESYNC_BILLING_INVOICES_URL`
- `STAGESYNC_CREDIT_CHECKOUT_URL`
- `STAGESYNC_CREDIT_RECEIPTS_URL`

### Site / auth

- `NEXT_PUBLIC_SITE_URL`
- `STAGESYNC_TEST_SESSION_SECRET`

## Repo layout

- `app/` - app routes, pages, and API routes
- `components/` - React UI components
- `lib/` - business logic and integrations
- `utils/` - Supabase client/server helpers
- `content/` - copy/localized UI text
- `supabase/` - database migrations and related SQL
- `e2e/` - Playwright tests
- `docs/` - longer feature notes and build plans

## Operational notes

- The repo uses test-only endpoints under `app/api/testing/*`; production gates should stay in place.
- PWA assets are generated during build, so don’t commit them.
- If you touch search or queueing, check both route tests and UI tests, because a lot of StageSync behavior is coupled between them.
