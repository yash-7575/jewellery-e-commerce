# AARANYA — Handoff for Mobile / Remote Continuation

Last updated: 2026-08-15 · Latest commit: `53eb5ae`

This doc is the single source of truth for picking the build back up from
another machine (mobile Claude Code, another laptop, whatever). Read this
top-to-bottom before dispatching any new agent — it prevents duplicate work
and secret leaks.

Companion docs (all in repo root):
- `DESIGN_SYSTEM.md` — tokens, patterns, class strings from `index.html`
- `ARCHITECTURE.md` — DynamoDB model + AWS diagram
- `API_CONTRACT.md` — every REST endpoint
- `INFRA.md` — real AWS resource ARNs, teardown order, known issues

---

## TL;DR — where we are

| Layer         | Status                                                                          |
|---------------|---------------------------------------------------------------------------------|
| Homepage      | ✅ ported to Next.js 15 App Router (`src/app/page.tsx`)                          |
| Design system | ✅ 14 shared components in `src/components/`                                     |
| Shop pages    | ✅ `/shop`, `/shop/[category]`, `/product/[slug]`, `/search` (using mock/live)   |
| AWS infra     | ✅ DynamoDB × 9, S3, CloudFront, Cognito, Secrets Manager, IAM in `ap-south-1`  |
| Backend API   | ✅ 10 Lambdas + HTTP API deployed, seeded, smoke-tested                          |
| Cart pages    | ❌ not built                                                                    |
| Checkout + Razorpay | ❌ not built (Razorpay test keys already in AWS Secrets Manager)          |
| Auth pages    | ❌ not built (Cognito is provisioned, just no UI)                               |
| Account/wishlist pages | ❌ not built                                                             |
| Static pages (About/Contact/FAQ/Shipping) | ❌ not built                                     |
| Wire real API | ⚠️ Partial — mock fallback exists; needs `NEXT_PUBLIC_API_BASE_URL` in `.env`   |
| README        | ❌ still the default 22-byte one                                                 |

---

## Live AWS resources — `ap-south-1` (Mumbai)

Full ARNs and teardown commands live in `INFRA.md`. Quick reference:

```
DynamoDB tables    aaranya-{products, categories, users, orders, cart,
                              wishlists, reviews, contact, search-tokens}
S3 media bucket    aaranya-media-40a233
CloudFront         E3H9KDMVRTOY29  →  d2wpw6wxp38zdc.cloudfront.net
Cognito user pool  aaranya-users   (ap-south-1_RycmYFmKc)
Cognito app client aaranya-web     (public, no secret)
Secrets Manager    aaranya/razorpay  (contains RAZORPAY_KEY_ID + _SECRET)
IAM roles          aaranya-lambda-api, aaranya-lambda-thumbnail
HTTP API           aaranya-api  (52e8sjfcp0)
API base URL       https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod
Lambdas (10)       aaranya-{products, categories, cart, orders, payments,
                              reviews, search, user, wishlist, contact}
```

Seeded data: **20 products** + **6 categories** in DynamoDB (mix of rings,
necklaces, earrings, bracelets, bangles, jhumkas with realistic Indian
names + INR prices + Unsplash imagery).

Smoke tests passed at deploy time:
- `GET /prod/v1/products` → 200, 20 items
- `GET /prod/v1/products/{slug}` → 200
- `GET /prod/v1/categories` → 200
- `GET /prod/v1/search?q=...` → 200
- `GET /prod/v1/cart` without token → 401 (authorizer works)

---

## Local repo state

```
jewellery-e-commerce/
├── .env                          # gitignored — Razorpay test keys + AWS region
├── .env.example                  # committed template
├── .gitignore                    # blocks .env, razorpay CSVs, node_modules, dist
├── index.html.reference          # original homepage, kept for diffing
├── DESIGN_SYSTEM.md              # brand tokens + component patterns
├── ARCHITECTURE.md               # DynamoDB + AWS diagram
├── API_CONTRACT.md               # every REST endpoint
├── INFRA.md                      # real AWS ARNs + teardown
├── HANDOFF.md                    # this file
├── next.config.mjs               # images.unsplash.com + cdn.aaranya.in allowed
├── tailwind.config.ts            # cream/forest palette + Playfair/Inter
├── tsconfig.json                 # excludes backend/
├── package.json                  # Next 15, React 19, TS 5.6, Tailwind 3.4
├── public/images/                # hero + Instagram-grid JPGs
├── src/
│   ├── app/
│   │   ├── layout.tsx            # next/font wiring for Playfair + Inter
│   │   ├── page.tsx              # homepage (DO NOT MODIFY unless intentional)
│   │   ├── globals.css           # Tailwind directives
│   │   └── (shop)/               # shop route group
│   │       ├── layout.tsx        # SiteHeader + SiteFooter wrapper
│   │       ├── shop/page.tsx     # /shop listing
│   │       ├── shop/ShopClient.tsx
│   │       ├── shop/[category]/page.tsx
│   │       ├── product/[slug]/page.tsx     # PDP
│   │       ├── product/[slug]/ProductGallery.tsx (client)
│   │       ├── product/[slug]/VariantSelector.tsx (client)
│   │       ├── product/[slug]/AddToBag.tsx        (client)
│   │       ├── search/page.tsx             # /search
│   │       └── search/SearchClient.tsx
│   ├── components/               # 14 shared primitives — reuse everywhere
│   │   ├── index.ts              # barrel export
│   │   ├── types.ts              # Product, Category, CartItem, User, etc.
│   │   ├── SiteHeader.tsx, SiteFooter.tsx
│   │   ├── ProductCard.tsx, PriceTag.tsx
│   │   ├── FilterSidebar.tsx, SortSelect.tsx
│   │   ├── QuantityStepper.tsx, WishlistButton.tsx
│   │   ├── Breadcrumbs.tsx, EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx, Button.tsx
│   │   └── NewsletterForm.tsx    # pre-existing client component
│   └── lib/
│       └── api.ts                # central API client (mock fallback if
│                                 # NEXT_PUBLIC_API_BASE_URL unset)
└── backend/
    ├── package.json              # @aws-sdk/*, razorpay, jsonwebtoken, esbuild
    ├── tsconfig.json
    ├── src/
    │   ├── handlers/             # 10 Lambda handlers (see below)
    │   └── lib/                  # dynamo, http, auth, razorpay, validate, response
    └── scripts/
        ├── build.sh              # esbuild + zip each handler
        ├── deploy.sh             # aws lambda create/update-function-code
        ├── provision-routes.sh   # API Gateway routes + Cognito authorizer
        └── seed.mjs              # populates DynamoDB with 20 products + 6 cats
```

`npm run build` **passes** on `main`. Homepage prerenders as static.

---

## Secrets — how they flow (do not break this)

Two secret files, both **gitignored** and never in commits:

1. **`.env`** at repo root (only for local Next.js dev):
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   AWS_REGION=ap-south-1
   # will need to add:
   #   NEXT_PUBLIC_API_BASE_URL=https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod
   #   NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_RycmYFmKc
   #   NEXT_PUBLIC_COGNITO_CLIENT_ID=<from INFRA.md>
   #   NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d2wpw6wxp38zdc.cloudfront.net
   ```

2. **`razorpay_test_api_keys_*.csv`** — the original file Yash downloaded from
   Razorpay. Left in place, blocked by `razorpay_*_api_keys_*.csv` in
   `.gitignore`. Do not delete, do not commit.

**Backend Lambdas do NOT read `.env`.** They fetch Razorpay keys from
AWS Secrets Manager (`aaranya/razorpay`) at cold start. This is the only
correct pattern — never bake secrets into Lambda env vars or code.

If you accidentally stage a secret: `git restore --staged <file>` and check
`git check-ignore -v <file>` to see why gitignore didn't catch it.

---

## Remaining work — the plan

Tasks are ordered by dependency. The tasks marked "parallelizable" have
**no file overlap** and can be fired as concurrent opencode agents.

### 🔴 Blocker for auth-gated pages
**Task A — Cognito hosted UI + admin group** (~30 min)
Nothing to build in code — just AWS setup so the auth pages have a place to
point users. Run:
```bash
aws cognito-idp create-user-pool-domain --domain aaranya-auth \
  --user-pool-id ap-south-1_RycmYFmKc --region ap-south-1
aws cognito-idp create-group --group-name admin \
  --user-pool-id ap-south-1_RycmYFmKc --region ap-south-1
```
Add the resulting hosted-UI URL to `INFRA.md`.

### 🟢 Parallelizable frontend (all can fire together)

**Task B — Cart + Checkout + Order confirmation**
- `src/app/(shop)/cart/page.tsx` — line items, quantity update, remove,
  subtotal, promo code input, "Proceed to checkout" button
- `src/app/(shop)/checkout/page.tsx` — 3-step: address → payment → review
- `src/app/(shop)/order/[id]/page.tsx` — confirmation page
- Razorpay integration: on "Pay Now", POST `/prod/v1/payments/create-order`,
  open Razorpay Checkout SDK (script: `https://checkout.razorpay.com/v1/checkout.js`)
  with the returned `razorpay_order_id`. On handler success POST
  `/prod/v1/payments/verify` then redirect to `/order/[id]`.
- Cart state: `localStorage` for guests, sync to DynamoDB via
  `/prod/v1/cart` when authed.

**Task C — Auth pages + Account dashboard + Wishlist**
- `src/app/(auth)/login`, `/signup`, `/forgot-password`, `/reset-password`
- `src/app/(account)/account/{orders,addresses,profile}/page.tsx`
- `src/app/(shop)/wishlist/page.tsx` — reuses `ProductCard`
- Auth SDK: `amazon-cognito-identity-js` OR use Cognito hosted UI redirect
  (simpler). Store tokens in memory + refresh via silent iframe.

**Task D — Static pages**
- `src/app/(marketing)/about/page.tsx`
- `src/app/(marketing)/contact/page.tsx` — form posts to `/prod/v1/contact`
- `src/app/(marketing)/shipping-returns/page.tsx`
- `src/app/(marketing)/faq/page.tsx`

**Task E — Wire real API + loading/error states**
- Add the env vars listed above to `.env`
- Replace mock fallback in `src/lib/api.ts` to always hit the API when the
  base URL is set
- Add `<Suspense>` boundaries with `LoadingSkeleton` on server components
- Add error boundaries (`error.tsx` in each route group)

**Task F — README**
- Replace the 22-byte stub with: overview, `npm install && npm run dev`,
  env var reference (point to `.env.example`), architecture summary
  (point to `ARCHITECTURE.md` + `INFRA.md`), how to redeploy backend
  (`cd backend && bash scripts/build.sh && bash scripts/deploy.sh`),
  how to swap in real Razorpay live keys.

---

## How to dispatch remote agents (mobile Claude Code)

The opencode server is systemd-managed and always running:
```
127.0.0.1:4096  opencode serve   (opencode-serve.service)
127.0.0.1:4173  jarvis dashboard (jarvis-orchestrator.service)
```

Both `Restart=always` + `loginctl enable-linger yash` → survive reboots.

**Reliable model for real work:** `deepseek-v4-flash-free` via the `opencode`
provider on OpenCode Zen. Free, calls tools reliably.

**Broken model to avoid:** `claude-opus-4-7`, `claude-sonnet-5`, `gpt-4o-mini`,
`gemini-2.0-flash` on OpenCode Zen — all returned `(no content)` for
tool-heavy prompts during this build. Kept costing us re-fires. If you must
use a Claude/OpenAI model, use the real Anthropic/OpenAI API directly, not
opencode-zen's proxy.

**Every agent prompt should include:**
- The exact absolute paths it can read/write
- Explicit `FORBIDDEN:` list (`.env`, razorpay CSV, `git commit/push`, etc.)
- What docs to read first (`DESIGN_SYSTEM.md`, `API_CONTRACT.md`, `INFRA.md`)
- A `DONE` sentinel to print at the end
- A build/test command to run so failures surface immediately

**After every code-writing agent, fire a review-and-push agent:**
1. `git status --short` — confirm nothing sensitive is staged
2. `grep -rEn "rzp_test|iLyzjSes|AKIA[0-9A-Z]{16}" src/ backend/src/` → must
   return nothing
3. `npm run build` → must exit 0
4. `git add <specific files>` (not `-A` blindly)
5. `git commit -m "…"` with a message that describes *why*, not just what
6. `git push origin main`

---

## Cost reality check

Everything provisioned is **free tier** except one line item:
- AWS Secrets Manager — **~$0.40/month** for `aaranya/razorpay` (approved)

Nothing else is billing. No NAT gateway, no ALB, no RDS, no ECS, no EC2.
CloudFront + Lambda + API GW + DynamoDB on-demand + S3 all sit in the
always-free tier at this scale. If a future agent tries to add any of the
big-ticket items, refuse until you approve.

Existing EC2 `i-0baa9aeae221e4684` (Yash Server, eu-north-1) is unrelated —
it was already there before this project started.

---

## Known issues carried over

From `INFRA.md`:
1. **CloudFront** was `InProgress` at deploy time but the domain
   `d2wpw6wxp38zdc.cloudfront.net` was already routable. Should be fully
   `Deployed` by now — verify with `aws cloudfront get-distribution --id
   E3H9KDMVRTOY29 --query 'Distribution.Status'`.
2. **CORS on the HTTP API is `AllowOrigins: ["*"]`** because API Gateway
   rejected wildcard hostname patterns like `https://*.vercel.app`.
   Fine while no credentials/cookies flow. Re-lock to explicit origins
   before turning on cookie auth.
3. **S3 versioning off** — enable if you care about media rollback.
4. **No `admin` group in Cognito yet** — needed before any admin endpoint
   authorizer will work. See Task A above.
5. **`src/lib/api.ts` falls back to hardcoded mock data** when
   `NEXT_PUBLIC_API_BASE_URL` is unset — pages render but not live data.
   Add the env var and the mock code path becomes unreachable.

---

## Task tracker snapshot

Local task IDs (from earlier session, non-portable — just for reference):

| # | Task                                                              | Status       |
|---|-------------------------------------------------------------------|--------------|
| 1 | Extract design system spec from index.html                        | ✅ completed |
| 2 | Architect DB schema + REST API contract                            | ✅ completed |
| 3 | Scaffold Next.js 15 project + port homepage                        | ✅ completed |
| 4 | Review architect + design outputs, get user approval               | ✅ completed |
| 5 | Provision AWS infra                                                | ✅ completed |
| 6 | Build Lambda + API Gateway endpoints per contract                  | ✅ completed |
| 7 | Seed jewellery product catalog                                     | ✅ completed |
| 8 | Build shop pages (listing + PDP + search)                          | ✅ completed |
| 9 | Build cart + checkout + order confirmation                         | ⏳ pending   |
| 10| Build auth pages + account dashboard + wishlist                    | ⏳ pending   |
| 11| Build static pages (About, Contact, Shipping, FAQ)                 | ⏳ pending   |
| 12| Wire frontend to real API + loading/error states                   | ⏳ pending   |
| 13| Write README with AWS architecture doc                              | ⏳ pending   |
| 14| Post-task review + git commit + push loop                          | ♻︎ ongoing   |
| 15| Build shared frontend components                                    | ✅ completed |

---

## First thing to do on remote resume

```bash
cd ~/Development/Client/jewellery-e-commerce  # or wherever you cloned
git pull origin main
npm install
cd backend && npm install && cd ..
npm run build      # sanity check — must exit 0
```

Then read this file top to bottom and pick a task (B/C/D/E/F are all
independent and can go in parallel). If you're firing multiple opencode
agents at once, brief each with a single-line "you may only touch this
directory" restriction so they don't collide on shared files.

Ram ram. 🙏
