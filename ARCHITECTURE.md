# AARANYA — Backend Architecture

**Stack:** API Gateway (REST) · Lambda (Node.js 20) · DynamoDB (on-demand, `ap-south-1`) · Cognito · S3 + CloudFront · AWS Secrets Manager · Razorpay (test mode)
**Frontend:** Next.js 15 App Router / TypeScript
**Companion doc:** `API_CONTRACT.md` (the wire contract that this doc's model backs).

---

## 1. System Diagram

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                      AARANYA PLATFORM                     │
                        └─────────────────────────────────────────────────────────┘

┌──────────────────┐                                         ┌──────────────────────────────┐
│  Next.js 15 (TS) │  HTTPS / JSON (REST v1)                 │   Amazon Cognito User Pool    │
│  App Router      │ ───────────────────────────────────────▶│   • sign-up / sign-in / SSO    │
│  (client + SSR)  │                                         │   • access + refresh tokens   │
└────────┬─────────┘                                         │   • Hosted UI                 │
         │  Cognito hosted UI / Amplify auth                 └──────────────▲───────────────┘
         │  (sign-up, sign-in, refresh)                                      │
         ▼                                                            JWKS /.well-known
┌──────────────────┐   Bearer JWT    ┌──────────────────────┐   │
│   CloudFront CDN │                 │  API Gateway REST ───┼────┐  Cognito Lambda Authorizer
│  cdn.aaranya.in  │                 │  /prod/v1/*           │    │  (verifies access token)
└────────┬─────────┘                 └──────────┬───────────┘    │
         ▲                                      │                │
         │   S3 origin (OAC, private)           ▼                ▼
         │                            ┌──────────────────────────────────────┐
┌────────┴─────────┐                  │     Lambda (Node 20)                  │
│  S3 media bucket │ ◀── presigned    │  • validation · authz · business logic│
│  (products,      │    PUT from FE   │  • DynamoDB + Razorpay + Secrets      │
│   categories,    │                  │  • PostConfirmation trigger (users)   │
│   reviews)       │                  └───────┬──────────────┬────────┬───────┘
└──────────────────┘                          │              │        │
                                              ▼              ▼        ▼
                                         ┌───────────┐  ┌─────────────┐  ┌──────────────────┐
                                         │ DynamoDB  │  │   S3 PUT /   │  │ AWS Secrets Mgmt  │
                                         │ (on-demand│  │ presign +    │  │ RAZORPAY_KEY_ID + │
                                         │  ap-south-1)│ thumbnails  │  │ RAZORPAY_SECRET   │
                                         └───────────┘  └─────────────┘  └──────────────────┘
                                              │                                  │
                                              │ (IAM role, no VPC = no NAT cost) │
                                              ▼                                  ▼
                                    ┌──────────────────────────────────────────────┐
                                    │           Razorpay (test mode)                │
                                    │   POST /v1/orders + /v1/payments/verify       │
                                    │   checkout.js hosted on the CDN               │
                                    └──────────────────────────────────────────────┘
```

Data + control flow:

1. **Auth** — sign-up/sign-in handled by Cognito (Hosted UI or Amplify SDK). API Gateway's **Cognito authorizer + Lambda authorizer for admin claims** lets handlers read the user identity from the verified access token. A Cognito *PostConfirmation* trigger creates the matching profile row in `aaranya-users`.
2. **Catalog reads** (public) — Lambda queries DynamoDB GSIs, applies the remaining filter/sort in memory, returns product cards.
3. **Checkout** — a `TransactWriteItems` atomically creates the order + order_items and decrements stock (conditional `stock >= qty`, else `OUT_OF_STOCK`), then `POST /payments/create-order` mints a Razorpay order. `POST /payments/verify` HMAC-verifies the signature and flips the order to `PAID`.
4. **Media** — Lambda returns a short-lived **S3 presigned PUT URL**; Next.js uploads directly to S3; a second `sharp` thumbnail lambda (S3 `s3:ObjectCreated`) emits `webp` variants. All reads go through **CloudFront** (OAC origin), never S3 directly.
5. **Secrets** — Razorpay keys live in **Secrets Manager** (fetched once at Lambda init and cached). Secrets are never in env vars or the client.

> **No VPC.** DynamoDB, S3, Secrets Manager, Cognito, and Razorpay are all reachable over the public AWS service endpoints with IAM credentials — there is no reason to place Lambdas inside a VPC, which is what would force a **NAT gateway** (a real monthly cost). We explicitly avoid NAT Gateway / ALB / RDS Multi-AZ.

---

## 2. Single-Table vs Multi-Table Decision

**Decision: Multi-table** (9 tables below).

Justification:

1. The workload splits into two shapes that share almost nothing: an **always-known-partition-key, user-scoped** set (cart, wishlist, orders — "everything for user X") and a **filter-heavy, read-mostly catalog** (products/categories) whose access paths are lookups, not item-type interleaving — the classic justification for single-table (one query fanning out across item types) never materialises here.
2. Each entity needs different lifecycle machinery: carts want **TTL** (abandon), orders are **append-only** (`ORDER` root + `ITEM#` children under one partition), reviews want a **moderation status GSI**; these would collide if forced under one table.
3. Product filtering over `category × metal × gemstone × price-range` cannot be served by a single-table sort key anyway (DynamoDB allows **one range key per index**) — coarse GSIs + Lambda-side filtering is the design lever regardless of table count, so single-table buys nothing here.
4. At AARANYA's scale (hundreds of SKUs, boutique throughput) on-demand pricing and IAM permissions stay clean and auditable per entity. Errors in one entity never take down another.

---

## 3. Data Model

Conventions:

- Numbers: `price` is **INR, integer, whole rupees** (e.g. `128000` = ₹1,28,000). Razorpay requires **paise** — the API layer sends `pricePaise = price * 100` and never exposes price conversion to the client.
- `dates` are ISO-8601 UTC strings.
- Inventory stock control is **reservation on order creation** (not decrement-on-sale), giving a 15-min grace for payment; `paid` decrements nothing further.
- Every write handler validates, every read is eventually-consistent by default; order/stock-critical reads may use `StronglyConsistentRead`.

### 3.1 `aaranya-products` (catalog, read-mostly)

| Element | Value |
|---|---|
| PK | `id` — human-readable SKU, e.g. `P-0042` |
| SK | `PRODUCT` (constant; always one item per product) |
| GSIs | see below |

Attributes: `slug` (unique, kebab-case), `name`, `subtitle`, `category`, `categoryId`, `description`, `metal`, `gemstone`, `weightG`, `size`, `price` (INR int), `stock`, `isActive`, `isFeatured`, `images[]`, `rating{average,count}`, `tags[]`, `createdAt`, `updatedAt`.

**GSIs on products** (all project the "card" fields: `name, slug, category, metal, gemstone, price, weightG, stock, images, rating`):

| GSI | PK | SK | Serves |
|---|---|---|---|
| `gsi_slug` | `slug` | (k) | get by slug |
| `gsi_category_price` | `category` | `price` | category browse sorted by price (asc/desc) |
| `gsi_category_created` | `category` | `createdAt` | category browse sorted newest |
| `gsi_metal_price` | `metal` | `price` | metal browse (e.g. all 22k gold) |
| `gsi_gem_price` | `gemstone` | `price` | gemstone browse (e.g. all polki) |

**Example item:**

```json
{
  "id": "P-0042",
  "sk": "PRODUCT",
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "subtitle": "22K Gold · Uncut Polki",
  "category": "bangles",
  "categoryId": "CAT-BANG",
  "description": "Hand-set uncut polki on hand-woven 22K gold wire.",
  "metal": "22k-gold",
  "gemstone": "none",
  "weightG": 18.4,
  "size": "Medium (16mm inner dia)",
  "price": 128000,
  "stock": 12,
  "isActive": true,
  "isFeatured": true,
  "images": [
    { "url": "https://cdn.aaranya.in/products/P-0042/hero.webp", "alt": "Mogra Bangle on marigold", "w": 1200, "h": 1600 },
    { "url": "https://cdn.aaranya.in/products/P-0042/gallery/01.webp", "alt": "Mogra bangle detail", "w": 1200, "h": 1600 }
  ],
  "rating": { "average": 4.8, "count": 23 },
  "tags": ["polki", "wedding", "heirloom"],
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-10T09:30:00Z"
}
```

> **Filtering note:** compound filters (e.g. `category=bangles AND metal=22k-gold AND gemstone=diamond AND price 1L–2L`) are served by `Query` on the most selective GSI + `FilterExpression`/in-memory filtering in Lambda for the named attributes + price range. Options (`metal`, `gemstone`, `category`) are controlled enums, so the filter space stays small. If the catalog ever exceeds ~few-thousand SKUs with heavy free-text search, add OpenSearch Serverless — an explicit future upgrade, not part of this build.

### 3.2 `aaranya-categories`

| Element | Value |
|---|---|
| PK | `id` — e.g. `CAT-BANG` |
| SK | `META` |
| GSI | `gsi_slug` (PK `slug`, projects `id,name,imageUrl,displayOrder`) |

**Example item:**

```json
{
  "id": "CAT-BANG",
  "sk": "META",
  "slug": "bangles",
  "name": "Bangles",
  "parentId": null,
  "imageUrl": "https://cdn.aaranya.in/categories/bangles.webp",
  "displayOrder": 2,
  "isActive": true
}
```

### 3.3 `aaranya-users` (profile + addresses, root item per user)

| Element | Value |
|---|---|
| PK | `userId` — Cognito `sub` |
| SK | `PROFILE` (the user) · `ADDR#<addressId>` (one item per address) |
| GSI | `gsi_email` (PK `email`, projects `userId`) — for email lookups |

**Example — profile:**

```json
{
  "userId": "ea6f...-cognito-sub",
  "sk": "PROFILE",
  "email": "ananya@example.com",
  "name": "Ananya Sharma",
  "phone": "+91 98000 00000",
  "isAdmin": false,
  "defaultAddressId": "ADDR-f3a9c",
  "createdAt": "2026-08-02T11:20:00Z",
  "lastSignInAt": "2026-08-15T06:12:00Z"
}
```

**Example — address (child item, same partition):**

```json
{
  "userId": "ea6f...-cognito-sub",
  "sk": "ADDR-f3a9c",
  "addressId": "f3a9c",
  "label": "Home",
  "recipient": "Ananya Sharma",
  "phone": "+91 98000 00000",
  "line1": "14, Rajpath Colony",
  "line2": "Near Diwan-e-Khas",
  "city": "Jaipur",
  "state": "Rajasthan",
  "pincode": "302019",
  "country": "IN",
  "isDefault": true,
  "createdAt": "2026-08-02T11:25:00Z"
}
```

> Profile row is created by the **Cognito `PostConfirmation` Lambda trigger**; admin flag set manually by ops.

### 3.4 `aaranya-orders` (order root + **order_items** children)

| Element | Value |
|---|---|
| PK | `orderId` — `ORD-YYYYMMDD-<5-char check>` |
| SK | `ORDER` (summary/root) · `ITEM#<1..n>` (one per line item) |
| GSIs | `gsi_user_created` (PK `userId`, SK `createdAt`, projects `orderId,status,amounts,total,itemCount,currency`) · `gsi_orderitem_product` (PK `productId`, projects `orderId,userId,qty,unitPrice`) → admin best-sellers |

Order root attributes: `userId`, `status` (`PENDING_PAYMENT → PAID → PROCESSING → SHIPPED → DELIVERED` | `CANCELLED` | `REFUNDED`), `amounts{subtotal,shipping,discount,tax,total}`, `currency`, `itemCount`, `shippingAddress` (snapshot), `payment{method,razorpayOrderId,razorpayPaymentId,paymentStatus,capturedAmount}`, `notes`, `timeline[]`, `createdAt`, `updatedAt`.

**Example — order root:**

```json
{
  "orderId": "ORD-20260815-7A2K9",
  "sk": "ORDER",
  "userId": "ea6f...-cognito-sub",
  "status": "PENDING_PAYMENT",
  "amounts": { "subtotal": 380000, "shipping": 0, "discount": 0, "tax": 0, "total": 380000 },
  "currency": "INR",
  "itemCount": 2,
  "shippingAddress": {
    "recipient": "Ananya Sharma", "phone": "+91 98000 00000",
    "line1": "14, Rajpath Colony", "city": "Jaipur",
    "state": "Rajasthan", "pincode": "302019", "country": "IN"
  },
  "payment": {
    "method": "razorpay",
    "razorpayOrderId": "order_OaBCdef1",
    "razorpayPaymentId": null,
    "paymentStatus": "PENDING",
    "capturedAmount": null
  },
  "timeline": [{ "status": "CREATED", "at": "2026-08-15T08:10:00Z" }],
  "createdAt": "2026-08-15T08:10:00Z",
  "updatedAt": "2026-08-15T08:10:00Z"
}
```

**Example — order item (`order_items` entity, same partition):**

```json
{
  "orderId": "ORD-20260815-7A2K9",
  "sk": "ITEM#1",
  "productId": "P-0042",
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "unitPrice": 128000,
  "qty": 1,
  "lineTotal": 128000,
  "metal": "22k-gold",
  "gemstone": "none",
  "weightG": 18.4,
  "size": "Medium",
  "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp"
}
```

> One `Query(PK=orderId)` returns root + all items → no cross-table JOIN, exactly one entry point for both "order by id" and "list mine" (via GSI → then `BatchGetItem`).

### 3.5 `aaranya-carts`

| Element | Value |
|---|---|
| PK | `userId` |
| SK | `ITEM#<productId>` (one per product; qty is an attribute) |
| TTL | `ttl` (epoch) — abandoned carts expire after 30 days |

**Example item:**

```json
{
  "userId": "ea6f...-cognito-sub",
  "sk": "ITEM#P-0042",
  "productId": "P-0042",
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "unitPrice": 128000,
  "qty": 2,
  "lineTotal": 256000,
  "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp",
  "metal": "22k-gold",
  "gemstone": "none",
  "weightG": 18.4,
  "size": "Medium",
  "addedAt": "2026-08-15T07:40:00Z",
  "ttl": 1787414400
}
```

> Price snapshots are refreshed at read-time from the products table (single `BatchGetItem`), so stale `unitPrice` in the cart never reaches checkout; `lineTotal` is computed there, **not trusted** from the item.

### 3.6 `aaranya-wishlists`

| Element | Value |
|---|---|
| PK | `userId` |
| SK | `ITEM#<productId>` |

**Example item:**

```json
{
  "userId": "ea6f...-cognito-sub",
  "sk": "ITEM#P-0042",
  "productId": "P-0042",
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "unitPrice": 128000,
  "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp",
  "addedAt": "2026-08-14T19:02:00Z"
}
```

### 3.7 `aaranya-reviews`

| Element | Value |
|---|---|
| PK | `productId` |
| SK | `<createdAt>#<reviewId>` (sortable, newest-first by default query) |
| GSIs | `gsi_user_created` (PK `userId`, SK `createdAt`, projects `reviewId,productId,rating,status`) · `gsi_status` (PK `status`, SK `createdAt`) → admin moderation queue |

Attributes: `reviewId` (`RVW-<hex>`), `userId`, `userName`, `rating` (1–5), `title`, `body`, `images[]`, `verifiedPurchase`, `status` (`PENDING → APPROVED | HIDDEN`), `createdAt`, `updatedAt`.

**Example item:**

```json
{
  "productId": "P-0042",
  "sk": "2026-08-12T09:00:00Z#RVW-6f1a9",
  "reviewId": "RVW-6f1a9",
  "userId": "ea6f...-cognito-sub",
  "userName": "Ananya S.",
  "rating": 5,
  "title": "Heirloom quality",
  "body": "The polki work is unreal — it catches light like nothing else in my collection.",
  "images": ["https://cdn.aaranya.in/reviews/RVW-6f1a9/01.webp"],
  "verifiedPurchase": true,
  "status": "APPROVED",
  "createdAt": "2026-08-12T09:00:00Z",
  "updatedAt": "2026-08-13T10:00:00Z"
}
```

> Public reviews endpoint only returns ships `status = APPROVED` (FilterExpression). Product `rating.average/count` aggregate is recomputed by a small handler on review approval (best-effort eventual), stored on the product item.

### 3.8 `aaranya-search-tokens` (supporting — prefix autocomplete + search)

| Element | Value |
|---|---|
| PK | `<first 2 lowercase chars of token>` (shard; e.g. `mo`) |
| SK | `token#<token>#<productId>` — e.g. `token#mogra#P-0042` |
| TTL | `ttl` — index is disposable (rebuilt on product write via index Lambda) |

Drives both `GET /search` (exact/prefix token) and `GET /search/suggest` (autocomplete: `Query(PK=shard, SK begins_with token#<prefix>)`, then Lambda dedups + ranks distinct tokens). **Not** the primary catalog browse path — a boutique-scale description-containment scan with `FilterExpression` is acceptable; swapped for OpenSearch only if the catalog grows large.

### 3.9 `aaranya-contact` (supporting — contact form)

| Element | Value |
|---|---|
| PK | `contactId` (`CT-<hex>`) |
| SK | `META` |
| GSI | `gsi_email` (PK `email`) |

Attributes: `name`, `email`, `phone`, `subject`, `message`, `status` (`NEW → DONE`), `createdAt`.

---

## 4. Access Patterns

| # | Pattern | Table / entity | Index / key used | Notes |
|---|---|---|---|---|
| 1 | Get product by id | products | `GetItem(PK=id)` | Admin edit |
| 2 | Get product by slug | products | `gsi_slug` | Public PDP |
| 3 | List products (category, sort=price asc) | products | `gsi_category_price` | Reverse for desc |
| 4 | List products (category, sort=newest) | products | `gsi_category_created` | |
| 5 | List products (metal) | products | `gsi_metal_price` | |
| 6 | List products (gemstone) | products | `gsi_gem_price` | |
| 7 | Filter by category+metal+gemstone+price | products | best-fit GSI + FilterExpression/filter in Lambda | Documented §3.1 |
| 8 | Search (query) | search-tokens + products | shard begins_with → items | Simpler: FilterExpression scan |
| 9 | Autocomplete (suggest) | search-tokens | shard begins_with, dedup tokens | |
| 10 | List categories | categories | `Scan` (small table) | |
| 11 | Category by slug | categories | `gsi_slug` | |
| 12 | Get profile by userId | users | `GetItem(sub, PROFILE)` | |
| 13 | Find user by email | users | `gsi_email` | Admin |
| 14 | List addresses for user | users | `Query(PK=userId, SK begins_with ADDR#)` | |
| 15 | Get cart | carts | `Query(PK=userId)` | + BatchGetItem prices |
| 16 | Add / update / remove cart item | carts | `PutItem` / `UpdateItem` / `DeleteItem` | |
| 17 | Clear cart | carts | `BatchWrite` delete all in partition | |
| 18 | Get wishlist | wishlists | `Query(PK=userId)` | |
| 19 | Add / remove wishlist item | wishlists | `PutItem` / `DeleteItem` | |
| 20 | Create order from cart | orders + carts | `TransactWriteItems` | Stock reservation + cart clear |
| 21 | Order by id (+ items) | orders | `Query(PK=orderId)` | Root + `ITEM#*` in one read |
| 22 | Orders for user, newest first | orders | `gsi_user_created` | | 
| 23 | Best sellers (top products) | orders | `gsi_orderitem_product` | Admin |
| 24 | Reviews for product, newest first | reviews | `Query(PK=productId)` + Filter status=APPROVED | |
| 25 | Reviews by user | reviews | `gsi_user_created` | |
| 26 | Review moderation queue | reviews | `gsi_status` | Admin |

---

## 5. S3 Layout + CloudFront

**Bucket** `aaranya-media-<acct>-ap-south-1` — **private** (no public ACLs, no bucket policy granting public reads), server-side encrypted (S3-managed key — free), versioned, no static website hosting.

```
s3://aaranya-media-<acct>-ap-south-1/
├── products/<productId>/
│   ├── original_<uuid>.{jpg,png,webp}        ← presigned PUT uploaded by Next.js
│   ├── hero.webp                             ← 1200×1600 (card/hero)  [sharpen lambda]
│   ├── gallery/01.webp 02.webp ...           ← 1200×1600
│   └── thumb/<id>_<w>x<h>.<ext>              ← responsive sizes  (sharp lambda)
├── categories/<categorySlug>.webp
├── reviews/<reviewId>/01.webp ...
└── users/<userId>/avatar.webp (optional)
```

- **Upload flow:** client asks `POST /v1/admin/products/:id/images` (or cart-less generic) → Lambda mints a **presigned S3 PUT URL** (15-min expiry, `Content-Type` pinned) → client PUTs directly to S3 → `s3:ObjectCreated` triggers a `sharp`-based Lambda that writes `hero.webp` + thumbnails. Media keys are namespaced by `productId`, so versions never collide.
- **CloudFront** distribution `cdn.aaranya.in`:
  - Origin = S3 bucket via **OAC (Origin Access Control)** — S3 stays private, CloudFront is the only reader.
  - Cache behaviors: `/products/*`, `/categories/*`, `/reviews/*` → default TTL 1 yr, `Cache-Control: public, max-age=31536000, immutable` (blob keys are immutable by design).
  - Viewer access **public** (product imagery is not gated); fine-grained content (receipts, DMs) would use signed URLs — not needed in v1.
  - ACM certificate = free (AARANYA domain), `ap-south-1`/global edge.
- CDN base URL is exposed to the browser only via env (`NEXT_PUBLIC_CLOUDFRONT_DOMAIN`) — never the S3 bucket.

---

## 6. Cognito Configuration

**User Pool** `aaranya-users-pool` (region `ap-south-1`), app client `aaranya-web` (**no client secret** — public client used by Next.js/Amplify).

| Setting | Value |
|---|---|
| Sign-up | `ALLOW_USER_SIGNUP` enabled, self-service |
| Sign-in aliases | `email` (also the username), `preferred_username` optional |
| Required attributes | `email` (verified), `name` |
| Optional attributes | `phone_number`, `custom:locale` |
| MFA | **OFF** |
| Password policy | min 8 chars; require uppercase + lowercase + number + symbol (4 of 4 types) |
| Password reset | self-service (email) |
| Email verification | REQUIRED on sign-up; Cognito sends verification code (or SES from-address later) |
| Admin | Cognito **group `admin`** — Lambda authorizer checks `cognito:groups == ["admin"]` for admin endpoints |
| Triggers | `PostConfirmation` → create `aaranya-users` PROFILE row |
| OAuth | Hosted UI sign-in / sign-out redirects to AARANYA domains |

Tokens: access token carries `sub` (user id) + claims; API Gateway validates signature against pool JWKS (cognito authorizer). Admin endpoints additionally require the `admin` group in the access token — checked in the authorizer so the claim never reaches Lambda untrusted.

---

## 7. Free-Tier / Cost Check

All in `ap-south-1`, on-demand. **Lambda never runs in a VPC → no NAT Gateway / no ALB / no RDS Multi-AZ** (deliberate). Only Secrets Manager has **no free tier** and is the guaranteed monthly spend.

| Resource | Free tier | After free tier | Verdict |
|---|---|---|---|
| Lambda (Node 20) | 1M requests + 400,000 GB-sec/mo (always free) | ~$0.20/M req + $0.0000167/GB-s | ✅ free at this scale |
| API Gateway (REST) | 1M requests/mo (first 12 months) | ~$3.50/M req + data out | ✅ configurable; cache **off** right now |
| DynamoDB on-demand | 25 GB storage (always); 2.5M RCU + 2.5M WCU/mo (first 12 months) | ~$0.25/M RCU, ~$1.25/M WCU; $0.25/GB-mo storage | ✅ on-demand = no idle provisioned cost |
| DynamoDB PITR | none | ~$0.20/GB-mo | ⚠️ optional; **off by default**, enable only when order history matters |
| S3 (Standard) | 5 GB (always); 20k GET + 2k PUT/mo (12 mo) | ~$0.023/GB-mo; ~$0.0004/1k GET | ✅ |
| CloudFront | 1 TB out + 10M requests/mo (12 mo) | ~$0.085/GB out (varies by edge) + $0.01/10k | ✅ |
| Cognito | first **50,000 MAU/mo free** | ~$0.0055/MAU beyond | ✅ shop-scale |
| Secrets Manager | **NO FREE TIER** | **$0.40/secret/mo + $0.05/10k API calls** | 🔴 **only real monthly cost** — expected spend < $1/mo. Alternative if budget-tight: SSM Parameter Store (Standard, free) — but stack spec keeps Secrets Manager |
| Secrets Manager API | cached at Lambda init; effectively 0 calls/mo | — | ✅ |
| ACM (CloudFront cert) | free | — | ✅ |
| KMS | use S3/DynamoDB/SecretsManager **AWS-managed keys** (free) | customer CMK ~$1/mo | ⚠️ avoid custom CMKs |
| CloudWatch Logs | first 5 GB/mo | ~$0.50/GB | ⚠️ set **retention = 7 days**, filter noisy lambdas |
| NAT GW / ALB / RDS Multi-AZ | — | — | ❌ **not used / not proposed** |

> **Single guaranteed line item:** Secrets Manager ≈ $0.40–$1/mo. Everything else sits comfortably inside free tier at boutique volume.

---

## 8. Environment Variables (names only — values live in `.env` / Lambda env / Secrets Manager)

**Frontend (Next.js, `NEXT_PUBLIC_*` are client-visible):**

```
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_COGNITO_REGION
NEXT_PUBLIC_COGNITO_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID
NEXT_PUBLIC_COGNITO_DOMAIN
NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN
NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT
NEXT_PUBLIC_CLOUDFRONT_DOMAIN
NEXT_PUBLIC_RAZORPAY_KEY_ID
```

**Lambda (server-side, injected by IaC):**

```
AWS_REGION
PRODUCTS_TABLE
CATEGORIES_TABLE
USERS_TABLE
ORDERS_TABLE
CARTS_TABLE
WISHLISTS_TABLE
REVIEWS_TABLE
SEARCH_TABLE
CONTACT_TABLE
MEDIA_BUCKET
CLOUDFRONT_DOMAIN
COGNITO_USER_POOL_ID
COGNITO_USER_POOL_CLIENT_ID
RAZORPAY_SECRETS_ARN
LOG_LEVEL
```

> Secrects are **not** env vars: `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` are read once from the secret referenced by `RAZORPAY_SECRETS_ARN` and cached in the Lambda container.