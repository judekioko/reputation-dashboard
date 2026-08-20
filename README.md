# Reputation Dashboard

Unified review inbox for local service businesses: Google + Facebook reviews in one place, AI-drafted replies, instant alerts on low ratings. Yelp is deferred until a reliable data source is confirmed.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Postgres + Prisma (see `prisma/schema.prisma`)
- Clerk for auth
- Stripe Billing for subscriptions, plan-gated features (`lib/plan.ts`)
- Claude API (Haiku) for reply drafting (`lib/anthropic.ts`)
- Resend (email) + Twilio (SMS) for alerts (`lib/alerts.ts`)

## How it works

1. **Onboarding** (`/onboarding`) — a signed-in user creates their `Account` and first `Location`.
2. **Connect sources** (`/dashboard/connect`) — OAuth into Google Business Profile and/or a Facebook Page per location (`app/api/auth/{google,facebook}`). Tokens are stored on `ReviewSource`.
3. **Sync** — `GET /api/cron/sync-reviews`, triggered every 30 minutes by Vercel Cron (`vercel.json`), pulls new reviews from every connected source, stores them, and drafts an AI reply for each via Claude.
4. **Alerts** — any review at or below the account's `AlertRule.maxRating` triggers an email (and SMS, on the Growth plan) within the same sync run. A weekly summary goes out every Monday (`/api/cron/weekly-summary`).
5. **Inbox** (`/dashboard`) — the owner reviews each AI draft, edits if needed, and sends. Replies are never posted automatically — `POST /api/reviews/[id]/reply` is the only path that sends one, and it requires the signed-in user to own the review.
6. **Billing** (`/dashboard/settings`) — Stripe Checkout to upgrade to Growth, Stripe Billing Portal to manage/cancel. The `stripe/webhooks` route keeps `Account.plan` in sync with the subscription.

## Setup

1. Install [Node.js 20+](https://nodejs.org).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` — Neon or Supabase Postgres connection string
   - Clerk keys from [dashboard.clerk.com](https://dashboard.clerk.com)
   - Stripe keys + two Price IDs (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`) with `lookup_key` set to `starter`/`growth`
   - Google OAuth client (Business Profile API scope) from [console.cloud.google.com](https://console.cloud.google.com) — requires requesting Business Profile API access
   - Facebook app credentials from [developers.facebook.com](https://developers.facebook.com) — requires App Review for `pages_read_user_content` in production
   - `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)
   - `RESEND_API_KEY`, Twilio credentials
   - `CRON_SECRET` — any random string; set the same value in Vercel's cron config

4. Push the schema to your database:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Set up a Stripe webhook (locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`) pointing at `/api/webhooks/stripe`, listening for `customer.subscription.*`.

## Project status

All seven MVP features from the build plan are scaffolded: onboarding, Google + Facebook OAuth connect, review sync, AI drafting, send-reply, alerting, weekly summaries, and billing. None of it has run against real API credentials yet — Node.js isn't installed in the environment this was built in, so `npm install` and a first `npm run dev` are the next step, followed by working through the Google Business Profile API and Facebook App Review approval processes (both are the realistic bottleneck, not the code).
