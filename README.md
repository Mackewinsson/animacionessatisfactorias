# Satisfying Ball Videos

Next.js app: customize the bouncing-ball animation in the browser and export MP4, GIF, WebM, or PNG sequences.

## Setup

```bash
cp .env.example .env.local
```

1. Create a [Clerk](https://dashboard.clerk.com) application and paste your **Publishable** and **Secret** keys into `.env.local`.
   - The [Clerk MCP](https://clerk.com/docs/guides/ai/mcp) server (`mcp.clerk.com`) provides SDK snippets only — it **cannot** read or write your API keys.
   - Quick apply: `./scripts/apply-clerk-env.sh pk_test_... sk_test_...`
2. In Clerk → **Paths**, set sign-in to `/sign-in`, sign-up to `/sign-up`, and after sign-in/up to `/studio` (or rely on the `NEXT_PUBLIC_CLERK_*` vars in `.env.example`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — **Studio** at `/studio` (requires sign-in).

## Auth (Clerk)

- [`proxy.ts`](proxy.ts) — `clerkMiddleware()` protects `/studio` and `/api/unlock`
- [`app/sign-in`](app/sign-in/[[...sign-in]]/page.tsx) / [`app/sign-up`](app/sign-up/[[...sign-up]]/page.tsx) — Clerk hosted UI
- [`app/api/unlock/route.ts`](app/api/unlock/route.ts) — requires a signed-in user via `auth()` from `@clerk/nextjs/server`

## Paywall (MVP)

- Set `PAYWALL_BYPASS=true` in `.env.local` to download without payment while building.
- Production: integrate **Stripe Checkout** in [`app/api/unlock/route.ts`](app/api/unlock/route.ts) (see comments). Redirect success URL to `/studio?session_id={CHECKOUT_SESSION_ID}`.

## Deploy (Vercel)

1. Import this repo (root directory is the project root).
2. Add env vars (`CLERK_*`, `PAYWALL_BYPASS=false` in production).
3. Push to `main` for automatic production deploys.

## Structure

- [`lib/simulation/`](lib/simulation/) — core 2D canvas physics engine
- [`components/BouncingRingCanvas.tsx`](components/BouncingRingCanvas.tsx) — live preview + recording
- [`lib/gifExport.ts`](lib/gifExport.ts) — client GIF encode (`gifenc`)
- [`lib/paywall.ts`](lib/paywall.ts) — unlock token in `sessionStorage`
