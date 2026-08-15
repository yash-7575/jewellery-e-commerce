# AARANYA — Fine Jewellery E-commerce

## Overview

AARANYA is a Next.js 15 storefront backed by a serverless AWS API, built for a Jaipur-based jewellery house (est. 1908 in-fiction). The homepage was designed by the client and ported verbatim; every other page and the entire backend were built in-session: a 10-function Lambda backend on an HTTP API Gateway, a 9-table DynamoDB catalog with real seeded product data, Cognito auth, an S3 + CloudFront media pipeline, and a Razorpay test-mode checkout.

## Tech stack

- Frontend: Next.js 15 (App Router, React Server Components), React 19, TypeScript, Tailwind CSS 3.4
- Fonts: Playfair Display + Inter via `next/font`
- Backend: AWS Lambda (Node.js 20) + API Gateway v2 (HTTP API) + DynamoDB (on-demand) + Cognito + S3 + CloudFront + Secrets Manager, all in `ap-south-1`
- Payments: Razorpay (test mode)

## Quickstart

```bash
git clone https://github.com/yash-7575/jewellery-e-commerce
cd jewellery-e-commerce
cp .env.example .env    # fill in the values (see below)
npm install
npm run dev             # http://localhost:3000
```

The production build is exercised with `npm run build`, which must exit 0.

## Environment variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

**Server-side** (only read by Node, never exposed to the browser):

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay publishable key. Client-visible in test mode, so it is not a secret. |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key. Used only to verify payment signatures server-side. |
| `AWS_REGION` | AWS region (expect `ap-south-1`). |

**Client-side** (`NEXT_PUBLIC_*`, safe to expose to the browser):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the deployed API, e.g. `https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod`. Every fetch in `src/lib/api.ts` is built off this. When unset, the API client falls back to hardcoded mock data so pages still render locally. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key id handed to the Checkout SDK in the browser. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito user pool id, e.g. `ap-south-1_RycmYFmKc`. |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito app client id for the public `aaranya-web` client. |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito hosted-UI domain used for hosted sign-in/sign-out flows. |
| `NEXT_PUBLIC_CLOUDFRONT_DOMAIN` | CloudFront CDN domain for product/category imagery, e.g. `d2wpw6wxp38zdc.cloudfront.net`. |

## Project layout

```
jewellery-e-commerce/
├── .env.example                  # committed env template
├── next.config.mjs               # image hosts: unsplash + cdn.aaranya.in
├── tailwind.config.ts            # cream/forest palette, Playfair + Inter
├── index.html.reference          # original homepage, kept for diffing
├── DESIGN_SYSTEM.md              # tokens + component primitives
├── ARCHITECTURE.md               # DynamoDB model + AWS diagram
├── API_CONTRACT.md               # every REST endpoint
├── INFRA.md                      # real AWS ARNs + teardown
├── HANDOFF.md                    # remote-resume notes
├── public/images/                # hero + Instagram-grid JPGs
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Playfair/Inter font wiring
│   │   ├── page.tsx              # homepage (client-designed, untouched)
│   │   ├── error.tsx             # root error boundary
│   │   ├── not-found.tsx         # global 404
│   │   ├── (shop)/               # shop, product, cart, checkout, wishlist
│   │   ├── (auth)/               # login, signup, password flows
│   │   ├── (account)/            # account + orders + addresses + profile
│   │   └── (marketing)/          # about, contact, faq, shipping, care
│   ├── components/               # 14 shared primitives (Button, EmptyState, ...)
│   └── lib/                      # api.ts, auth.ts, cart.ts, razorpay.ts
└── backend/
    ├── src/handlers/             # 10 Lambda handlers
    ├── src/lib/                  # dynamo, http, auth, razorpay, validate
    └── scripts/                  # build.sh, deploy.sh, provision-routes.sh, seed.mjs
```

## AWS architecture

A Next.js storefront talks over HTTPS to HTTP API `aaranya-api` (`52e8sjfcp0`), which routes 32 REST routes (`/prod/v1/*`) to 10 Node.js 20 Lambdas backed by 9 on-demand DynamoDB tables. Cognito user pool `ap-south-1_RycmYFmKc` handles identity and its JWT authorizer protects customer routes. Product media lives in a private S3 bucket served exclusively through CloudFront (`d2wpw6wxp38zdc.cloudfront.net`) via Origin Access Control. Razorpay keys are fetched from AWS Secrets Manager at Lambda cold start — never from environment variables. Lambdas run outside a VPC, so there is no NAT gateway, ALB, or RDS anywhere. See `ARCHITECTURE.md` for the data model and `INFRA.md` for every ARN and teardown order.

## Backend deployment

```bash
cd backend
npm install
bash scripts/build.sh    # esbuild + zip each handler
bash scripts/deploy.sh   # update existing Lambdas
```

Run `scripts/provision-routes.sh` exactly once per account — it creates the API Gateway routes and the Cognito authorizer. Running it again will fail on already-existing routes.

## Seeding

```bash
node backend/scripts/seed.mjs   # 20 products + 6 categories
```

## Razorpay

Currently in **TEST mode**. To switch to live keys, replace the values in AWS Secrets Manager:

```bash
aws secretsmanager update-secret --secret-id aaranya/razorpay \
  --secret-string '{"RAZORPAY_KEY_ID":"rzp_live_...","RAZORPAY_KEY_SECRET":"..."}'
```

Also update `NEXT_PUBLIC_RAZORPAY_KEY_ID` in your production `.env` / Vercel environment so the checkout SDK uses the live publishable key.

## Pages

- `/` — Homepage
- `/shop` — Product listing with filters
- `/shop/[cat]` — Category listing
- `/product/[slug]` — PDP with gallery, variants, add-to-bag
- `/search` — Search with autocomplete
- `/cart` — Cart
- `/checkout` — 3-step checkout with Razorpay
- `/order/[id]` — Order confirmation
- `/wishlist` — Wishlist (auth)
- `/login` `/signup` `/forgot-password` `/reset-password` — Auth flows
- `/account` (+ `/orders` `/addresses` `/profile`) — Account dashboard (auth)
- `/about` `/contact` `/faq` `/shipping-returns` `/care-guide` — Static pages

## Docs

- `DESIGN_SYSTEM.md` — design tokens + component primitives
- `ARCHITECTURE.md` — DynamoDB model + AWS system diagram
- `API_CONTRACT.md` — every endpoint, payload, and error code
- `INFRA.md` — real AWS ARNs, env vars, teardown order
- `HANDOFF.md` — remote-resume notes and agent dispatch conventions

## Cost

Everything sits inside the AWS free tier except AWS Secrets Manager (~$0.40/mo for the `aaranya/razorpay` secret). There is no NAT gateway, ALB, or RDS — Lambdas, API Gateway, DynamoDB on-demand, S3, and CloudFront all fit comfortably within the always-free allowances at boutique volume.

## License

Private / client project.