# AARANYA — REST API Contract (v1)

Base URL: `https://<api-id>.execute-api.ap-south-1.amazonaws.com/prod`
CDN base URL: `https://cdn.aaranya.in`
Companion doc: `ARCHITECTURE.md` (DynamoDB model backing every endpoint here).

---

## 1. Conventions

### 1.1 Auth
| Auth mode | Where to set | Header | Meaning |
|---|---|---|---|
| `public` | none | — | No auth required |
| `cognito-jwt` | API Gateway Cognito Authorizer | `Authorization: Bearer <access_token>` | Any signed-in AARANYA customer |
| `admin` | Lambda Authorizer (checks `cognito:groups == ["admin"]`) | `Authorization: Bearer <access_token>` | Must belong to Cognito `admin` group |

Identity available to handlers on protected routes: `userId` (= Cognito `sub`), `email`, `name`, `cognito:groups`.

### 1.2 Requests
- Content-Type: `application/json` everywhere. No cookies; tokens in the `Authorization` header.
- Amounts: `price` / `amount` in **INR, integer whole rupees**. Razorpay payloads (`amount` in *create-order* response / request) are in **paise** (`amountPaise = price × 100`) — flagged inline.

### 1.3 Response envelope
Success bodies are bare JSON (no wrapper). Errors are always:

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No product exists for slug 'mogra-bangle-uncut-polki'.",
    "field": null
  }
}
```

### 1.4 Standard status codes
| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `202` | Accepted (async, e.g. contact form) |
| `400` | Validation error (bad shape, bad enum, missing required) |
| `401` | Missing / invalid / expired token |
| `403` | Authenticated but not permitted |
| `404` | Resource not found |
| `409` | Conflict (e.g. out of stock, duplicate) |
| `500` | Server error |

### 1.5 Pagination
List endpoints accept `?limit=` (default 24, max 100) and `?cursor=` (opaque base64 returned by the previous page). Cursor encodes the DynamoDB `LastEvaluatedKey` — clients must treat it as opaque. `nextCursor: null` means the last page. Ordering is fixed server-side per endpoint; `cursor` never carries sort state.

---

## 2. Products

### 2.1 `GET /v1/products` — list & filter
**Auth:** `public`

**Query params:**
| Param | Type | Notes |
|---|---|---|
| `category` | string | category slug, e.g. `rings` |
| `metal` | enum | `22k-gold` \| `silver` \| `rose-gold` \| `platinum` |
| `gemstone` | enum | `diamond` \| `ruby` \| `emerald` \| `polki` \| `none` |
| `minPrice` / `maxPrice` | number | INR, inclusive |
| `sort` | enum | `price_asc` \| `price_desc` \| `newest` \| `popular` (default `newest`) |
| `q` | string | free-text; falls back to search path if present |
| `limit` / `cursor` | number / string | §1.5 |

Each filter is optional; provided filters are ANDed.

**Response `200`:**
```json
{
  "items": [
    {
      "id": "P-0042",
      "slug": "mogra-bangle-uncut-polki",
      "name": "Mogra Bangle",
      "subtitle": "22K Gold · Uncut Polki",
      "category": "bangles",
      "metal": "22k-gold",
      "gemstone": "none",
      "weightG": 18.4,
      "size": "Medium (16mm inner dia)",
      "price": 128000,
      "currency": "INR",
      "images": [{ "url": "https://cdn.aaranya.in/products/P-0042/hero.webp", "alt": "Mogra Bangle on marigold", "w": 1200, "h": 1600 }],
      "rating": { "average": 4.8, "count": 23 },
      "isFeatured": true,
      "inStock": true,
      "createdAt": "2026-08-01T10:00:00Z"
    }
  ],
  "count": 24,
  "nextCursor": "eyJsYXN0S2V5IjoiUE0tMDA0MiJ9"
}
```

**Errors:** `400 INVALID_FILTER_VALUE` (bad metal/gemstone/sort), `400 INVALID_PRICE_RANGE` (`minPrice > maxPrice`). *Products with `isActive:false` are never returned on public endpoints.*

---

### 2.2 `GET /v1/products/:slug` — get by slug
**Auth:** `public`

**Response `200`:**
```json
{
  "id": "P-0042",
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "subtitle": "22K Gold · Uncut Polki",
  "category": "bangles",
  "categoryName": "Bangles",
  "description": "Hand-set uncut polki on hand-woven 22K gold wire.",
  "metal": "22k-gold",
  "gemstone": "none",
  "weightG": 18.4,
  "size": "Medium (16mm inner dia)",
  "price": 128000,
  "currency": "INR",
  "stock": 12,
  "inStock": true,
  "images": [
    { "url": "https://cdn.aaranya.in/products/P-0042/hero.webp", "alt": "…", "w": 1200, "h": 1600 },
    { "url": "https://cdn.aaranya.in/products/P-0042/gallery/01.webp", "alt": "…", "w": 1200, "h": 1600 }
  ],
  "rating": { "average": 4.8, "count": 23 },
  "tags": ["polki", "wedding", "heirloom"],
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-10T09:30:00Z"
}
```

**Errors:** `404 PRODUCT_NOT_FOUND` / `404 PRODUCT_NOT_ACTIVE` (exists but `isActive:false`).

---

### 2.3 `POST /v1/admin/products` — create product
**Auth:** `admin`

**Request:**
```json
{
  "slug": "mogra-bangle-uncut-polki",
  "name": "Mogra Bangle",
  "subtitle": "22K Gold · Uncut Polki",
  "category": "bangles",
  "description": "Hand-set uncut polki on hand-woven 22K gold wire.",
  "metal": "22k-gold",
  "gemstone": "none",
  "weightG": 18.4,
  "size": "Medium (16mm inner dia)",
  "price": 128000,
  "stock": 12,
  "isFeatured": false,
  "images": [],
  "tags": ["polki"]
}
```
`slug` and `name` required; `category` must be an existing category slug; `price > 0`.

**Response `201`:** the created product (same shape as §2.2).

**Errors:** `400 VALIDATION_ERROR`, `409 SLUG_EXISTS`, `400 CATEGORY_NOT_FOUND`.

---

### 2.4 `PUT /v1/admin/products/:id` — update product
**Auth:** `admin`
Partial update — omit untouched fields. Same body/shape as §2.3 (all optional, `slug` optional but must stay unique), returns `200` with the updated product.

**Errors:** `404 PRODUCT_NOT_FOUND`, `409 SLUG_EXISTS`, `400 VALIDATION_ERROR`.

---

### 2.5 `DELETE /v1/admin/products/:id` — delete product (soft)
**Auth:** `admin`
Sets `isActive:false` (hidden from storefront; order history/deeper image URLs stay intact).

**Response `200`:** `{ "id": "P-0042", "isActive": false }`

**Errors:** `404 PRODUCT_NOT_FOUND`.

---

### 2.6 `POST /v1/admin/products/:id/images` — request media upload
**Auth:** `admin`

**Request:**
```json
{
  "filename": "bangle-detail.png",
  "contentType": "image/png",
  "kind": "gallery"
}
```
`kind`: `hero` \| `gallery`.

**Response `200`:**
```json
{
  "uploadUrl": "https://aaranya-media-….s3.ap-south-1.amazonaws.com/products/P-0042/original_1b2c.webp?X-Amz-…",
  "expiresIn": 900,
  "finalUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp"
}
```
Client `PUT`s the image to `uploadUrl` directly (15-min window). A background lambda generates `hero.webp` / thumbnails.

**Errors:** `404 PRODUCT_NOT_FOUND`, `400 VALIDATION_ERROR` (unsupported `contentType`, missing `kind`).

---

## 3. Categories

### 3.1 `GET /v1/categories` — list
**Auth:** `public`

**Response `200`:**
```json
{
  "items": [
    { "id": "CAT-BANG", "slug": "bangles", "name": "Bangles", "imageUrl": "https://cdn.aaranya.in/categories/bangles.webp", "productCount": 27, "displayOrder": 2 }
  ],
  "count": 6
}
```
`productCount` is a best-effort aggregate, may be slightly stale.

**Errors:** none (empty list on empty catalog).

---

### 3.2 `GET /v1/categories/:slug` — get category
**Auth:** `public`

**Response `200`:**
```json
{ "id": "CAT-BANG", "slug": "bangles", "name": "Bangles", "parentId": null, "imageUrl": "https://cdn.aaranya.in/categories/bangles.webp", "displayOrder": 2 }
```

**Errors:** `404 CATEGORY_NOT_FOUND`.

---

## 4. Cart

Cart items carry a price snapshot but the server **re-validates prices/stock from the products table at every read**; the client never sends prices.

### 4.1 `GET /v1/cart` — get cart
**Auth:** `cognito-jwt`

**Response `200`:**
```json
{
  "items": [
    { "productId": "P-0042", "slug": "mogra-bangle-uncut-polki", "name": "Mogra Bangle", "unitPrice": 128000, "qty": 2, "lineTotal": 256000, "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp", "metal": "22k-gold", "gemstone": "none", "inStock": true }
  ],
  "count": 1,
  "totals": { "subtotal": 256000, "shipping": 0, "taxIncluded": true, "grandTotal": 256000 }
}
```

**Errors:** `401`.

---

### 4.2 `POST /v1/cart/items` — add item
**Auth:** `cognito-jwt`

**Request:**
```json
{ "productId": "P-0042", "qty": 2 }
```
If the product is already in the cart, quantities merge (cap 10 per line).

**Response `200`:** full cart (`GET /v1/cart` shape).

**Errors:** `400 VALIDATION_ERROR`, `404 PRODUCT_NOT_FOUND`, `409 OUT_OF_STOCK` (mostly catalyzed: `qty > stock`), `409 MAX_QTY_PER_LINE`.

---

### 4.3 `PATCH /v1/cart/items/:productId` — update quantity
**Auth:** `cognito-jwt`

**Request:**
```json
{ "qty": 1 }
```
`qty = 0` acts as remove.

**Response `200`:** full cart.

**Errors:** `404 CART_ITEM_NOT_FOUND`, `409 OUT_OF_STOCK`, `400 VALIDATION_ERROR`.

---

### 4.4 `DELETE /v1/cart/items/:productId` — remove item
**Auth:** `cognito-jwt`

**Response `204`:** no body.

**Errors:** `404 CART_ITEM_NOT_FOUND`.

---

### 4.5 `DELETE /v1/cart` — clear cart
**Auth:** `cognito-jwt`

**Response `204`:** no body. Idempotent (clearing an empty cart returns 204).

---

## 5. Wishlist

### 5.1 `GET /v1/wishlist` — list
**Auth:** `cognito-jwt`

**Response `200`:**
```json
{
  "items": [
    { "productId": "P-0042", "slug": "mogra-bangle-uncut-polki", "name": "Mogra Bangle", "price": 128000, "currency": "INR", "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp", "addedAt": "2026-08-14T19:02:00Z", "inStock": true }
  ],
  "count": 1
}
```

---

### 5.2 `POST /v1/wishlist/items` — add
**Auth:** `cognito-jwt`

**Request:** `{ "productId": "P-0042" }`

**Response `201`:**
```json
{ "productId": "P-0042", "slug": "mogra-bangle-uncut-polki", "addedAt": "2026-08-15T10:00:00Z" }
```
Idempotent — re-adding an existing item returns `201` (or `200`, client should tolerate both).

**Errors:** `404 PRODUCT_NOT_FOUND`, `400 VALIDATION_ERROR`.

---

### 5.3 `DELETE /v1/wishlist/items/:productId` — remove
**Auth:** `cognito-jwt`

**Response `204`.** Idempotent.

---

## 6. Orders

### 6.1 `POST /v1/orders` — create order from cart
**Auth:** `cognito-jwt`

**Request:**
```json
{
  "addressId": "f3a9c",
  "notes": null
}
```
`addressId` = one of the user's saved addresses (§8.3). Payment is **not** created here — the order starts `PENDING_PAYMENT` for 15 minutes and stock stays reserved for that window.

Server atomically: reads cart → validates all items exist, `isActive`, `qty <= stock` → writes order root + `ITEM#*` children and decrements stock via `TransactWriteItems` → clears the cart.

**Response `201`:** order (same shape as §6.3, `status: "PENDING_PAYMENT"`, `paymentStatus: "PENDING"`, includes inline `items[]`).

**Errors:** `400 CART_EMPTY`, `404 ADDRESS_NOT_FOUND`, `409 OUT_OF_STOCK` (with `items:[{productId, requested, available}]`), `409 PRODUCT_UNACTIVE`.

---

### 6.2 `GET /v1/orders` — list my orders
**Auth:** `cognito-jwt`

**Query:** `?status=` (enum: `PENDING_PAYMENT` \| `PAID` \| `PROCESSING` \| `SHIPPED` \| `DELIVERED` \| `CANCELLED` \| `REFUNDED`), `?limit=20&cursor=`.

**Response `200`:** newest-first summaries (no items inline, no addresses):
```json
{
  "items": [
    { "orderId": "ORD-20260815-7A2K9", "status": "PAID", "currency": "INR", "total": 380000, "itemCount": 2, "createdAt": "2026-08-15T08:10:00Z" }
  ],
  "count": 1,
  "nextCursor": null
}
```

**Errors:** `401`.

---

### 6.3 `GET /v1/orders/:orderId` — get my order
**Auth:** `cognito-jwt` (owner) · `admin` (any)

**Response `200`:**
```json
{
  "orderId": "ORD-20260815-7A2K9",
  "status": "PAID",
  "amounts": { "subtotal": 380000, "shipping": 0, "discount": 0, "tax": 0, "total": 380000 },
  "currency": "INR",
  "itemCount": 2,
  "shippingAddress": { "recipient": "Ananya Sharma", "phone": "+91 98000 00000", "line1": "14, Rajpath Colony", "line2": "Near Diwan-e-Khas", "city": "Jaipur", "state": "Rajasthan", "pincode": "302019", "country": "IN" },
  "payment": { "method": "razorpay", "razorpayOrderId": "order_OaBCdef1", "razorpayPaymentId": "pay_xyz", "paymentStatus": "CAPTURED", "capturedAmount": 38000000 },
  "items": [
    { "productId": "P-0042", "slug": "mogra-bangle-uncut-polki", "name": "Mogra Bangle", "unitPrice": 128000, "qty": 1, "lineTotal": 128000, "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp" }
  ],
  "timeline": [
    { "status": "CREATED", "at": "2026-08-15T08:10:00Z" },
    { "status": "PAID", "at": "2026-08-15T08:11:20Z" }
  ],
  "createdAt": "2026-08-15T08:10:00Z",
  "updatedAt": "2026-08-15T08:11:20Z"
}
```
`payment.capturedAmount` is in **paise** (raw Razorpay value) — client formats via `pricePaise` convention.

**Errors:** `404 ORDER_NOT_FOUND` (also returned when the order exists but belongs to another user — do not leak), `403` (non-owner, non-admin).

---

## 7. Reviews

### 7.1 `GET /v1/products/:slug/reviews` — list for product
**Auth:** `public`

**Query:** `?limit=20&cursor=&sort=newest|highest|lowest` (default `newest`). Only `status: APPROVED` reviews are returned.

**Response `200`:**
```json
{
  "items": [
    { "reviewId": "RVW-6f1a9", "userName": "Ananya S.", "rating": 5, "title": "Heirloom quality", "body": "The polki work is unreal…", "images": ["https://cdn.aaranya.in/reviews/RVW-6f1a9/01.webp"], "verifiedPurchase": true, "createdAt": "2026-08-12T09:00:00Z" }
  ],
  "count": 1,
  "aggregate": { "average": 4.8, "count": 23 },
  "nextCursor": null
}
```

**Errors:** `404 PRODUCT_NOT_FOUND`.

---

### 7.2 `POST /v1/products/:slug/reviews` — create review
**Auth:** `cognito-jwt`

**Request:**
```json
{ "rating": 5, "title": "Heirloom quality", "body": "The polki work is unreal…", "images": ["https://cdn.aaranya.in/reviews/RVW-6f1a9/01.webp"] }
```
One review per product per user (`409 REVIEW_EXISTS` otherwise). `verifiedPurchase` is auto-set from the user's order history. Status defaults to `PENDING` (admin approves).

**Response `201`:**
```json
{ "reviewId": "RVW-6f1a9", "status": "PENDING", "createdAt": "2026-08-15T11:00:00Z" }
```

**Errors:** `400 VALIDATION_ERROR` (rating not 1–5), `404 PRODUCT_NOT_FOUND`, `409 REVIEW_EXISTS`.

---

### 7.3 `DELETE /v1/reviews/:reviewId` — delete my review
**Auth:** `cognito-jwt` (owner) · `admin` (any)

**Response `204`.**

**Errors:** `404 REVIEW_NOT_FOUND` (also returned for other users' reviews).

---

## 8. User

### 8.1 `GET /v1/me` — get profile
**Auth:** `cognito-jwt`

**Response `200`:**
```json
{ "userId": "ea6f…", "email": "ananya@example.com", "name": "Ananya Sharma", "phone": "+91 98000 00000", "isAdmin": false, "defaultAddressId": "f3a9c", "createdAt": "2026-08-02T11:20:00Z" }
```

**Errors:** `401`, `404 USER_NOT_FOUND` (profile row missing — rare).

---

### 8.2 `PATCH /v1/me` — update profile
**Auth:** `cognito-jwt`

**Request:**
```json
{ "name": "Ananya Sharma", "phone": "+91 98123 45678" }
```
Changing `email` goes through Cognito self-service, **not** this endpoint (Cognito owns identity).

**Response `200`:** updated profile (§8.1 shape).

**Errors:** `400 VALIDATION_ERROR`.

---

### 8.3 `GET /v1/me/addresses` — list addresses
**Auth:** `cognito-jwt`

**Response `200`:**
```json
{
  "items": [
    { "addressId": "f3a9c", "label": "Home", "recipient": "Ananya Sharma", "phone": "+91 98000 00000", "line1": "14, Rajpath Colony", "line2": "Near Diwan-e-Khas", "city": "Jaipur", "state": "Rajasthan", "pincode": "302019", "country": "IN", "isDefault": true }
  ],
  "count": 1
}
```

---

### 8.4 `POST /v1/me/addresses` — add address
**Auth:** `cognito-jwt`

**Request:**
```json
{
  "label": "Work", "recipient": "Ananya Sharma", "phone": "+91 98000 00000",
  "line1": "B-402, C-Scheme", "line2": "", "city": "Jaipur", "state": "Rajasthan",
  "pincode": "302001", "country": "IN", "isDefault": true
}
```
Required: `recipient`, `phone`, `line1`, `city`, `state`, `pincode` (6 digits), `country` (`IN` default). If `isDefault` → clears previous default.

**Response `201`:** created address (§8.3 item shape).

**Errors:** `400 VALIDATION_ERROR`.

---

### 8.5 `DELETE /v1/me/addresses/:addressId` — delete address
**Auth:** `cognito-jwt`

**Response `204`.** Cannot delete the address currently set as `defaultAddressId`. Setting a new default automatically reassigns.

**Errors:** `404 ADDRESS_NOT_FOUND`, `409 ADDRESS_IS_DEFAULT`.

---

## 9. Search

### 9.1 `GET /v1/search` — query
**Auth:** `public`

**Query:** `?q=<term>&limit=24`. Case-insensitive match against `name`, `subtitle`, `tags`.

**Response `200`:** product cards (same items shape as `GET /v1/products`, §2.1) + `nextCursor`.

**Errors:** `400 VALIDATION_ERROR` (`q` too short, < 2 chars).

---

### 9.2 `GET /v1/search/suggest` — autocomplete
**Auth:** `public`

**Query:** `?q=<prefix>&limit=10` (min 2 chars).

**Response `200`:**
```json
{
  "suggestions": [
    { "type": "product", "text": "Mogra", "slug": "mogra-bangle-uncut-polki", "imageUrl": "https://cdn.aaranya.in/products/P-0042/hero.webp" },
    { "type": "category", "text": "Bangles", "slug": "bangles" }
  ]
}
```
Suggestion sources: matching product-name tokens, matched category slugs.

**Errors:** `400 VALIDATION_ERROR`.

---

## 10. Payments (Razorpay, test mode)

Flow: §6.1 creates the order → §10.1 mints a Razorpay order → client invokes `checkout.js` with the returned `keyId`/`razorpayOrderId` → on `onSuccess`, §10.2 verifies and marks paid.

### 10.1 `POST /v1/payments/create-order`
**Auth:** `cognito-jwt` (owner)

**Request:**
```json
{ "orderId": "ORD-20260815-7A2K9" }
```

**Response `200`:**
```json
{
  "razorpayOrderId": "order_OaBCdef1",
  "amountPaise": 38000000,
  "amount": 380000,
  "currency": "INR",
  "keyId": "<rzp-test-publishable-key-id>",
  "receipt": "ORD-20260815-7A2K9",
  "notes": { "userId": "ea6f…" },
  "expiresAt": "2026-08-15T08:25:00Z"
}
```
`keyId` is the **public** Razorpay key (safe for the browser — from Secrets Manager, served server-side). Server calls Razorpay **Orders API** with `amount = order.total × 100` and persists `razorpayOrderId` on the order.

**Errors:** `404 ORDER_NOT_FOUND` (non-owned too), `409 ORDER_NOT_PAYABLE` (not `PENDING_PAYMENT`), `409 ORDER_EXPIRED` (15-min window elapsed → stock released, order `CANCELLED` — re-checkout via §6.1).
**Strongly recommended:** also create a Razorpay **webhook** (`payment.captured` → reconci order paid) server-side as a safety net for test-mode — webhooks are not part of this REST contract.

---

### 10.2 `POST /v1/payments/verify`
**Auth:** `cognito-jwt`

**Request:**
```json
{
  "razorpay_order_id": "order_OaBCdef1",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "e1f2a3b4c5d6…"
}
```

Verification (server-side, Razorpay algorithm):
```
payload = razorpay_order_id + "|" + razorpay_payment_id
expected = HMAC_SHA256(payload, razorpay_key_secret).hexdigest()
valid = constant_time_compare(expected, razorpay_signature)
```
On success, order → `PAID`, `paymentStatus=CAPTURED`, `razorpayPaymentId` persisted.

**Response `200`:**
```json
{ "orderId": "ORD-20260815-7A2K9", "status": "PAID", "paymentStatus": "CAPTURED" }
```

**Errors:** `400 INVALID_SIGNATURE` (do **not** mark paid — client retries with fresh payment), `404 RAZORPAY_ORDER_NOT_FOUND`, `409 ALREADY_PAID` (idempotent-safe marker for double-submit).

---

## 11. Contact

### 11.1 `POST /v1/contact`
**Auth:** `public`

**Request:**
```json
{
  "name": "Ritika Mehta",
  "email": "ritika@example.com",
  "phone": "+91 99000 00000",
  "subject": "Custom commission enquiry",
  "message": "I would like a bespoke kundan set…"
}
```
`name`, `email` (valid format), `message` (≥ 10 chars) required.

**Response `202`:**
```json
{ "contactId": "CT-3f2a", "status": "NEW", "createdAt": "2026-08-15T12:30:00Z" }
```
Stored in `aaranya-contact`; ops team triages in a later tool. (Emailing the store from this endpoint is optional and swaps the stack into SES — out of scope for v1, noted for the future.)

**Errors:** `400 VALIDATION_ERROR`, `429 RATE_LIMITED` (soft per-IP/IP-hash throttle).

---

## 12. Endpoint Index

| Method | Path | Auth |
|---|---|---|
| GET | `/v1/products` | public |
| GET | `/v1/products/:slug` | public |
| POST | `/v1/admin/products` | admin |
| PUT | `/v1/admin/products/:id` | admin |
| DELETE | `/v1/admin/products/:id` | admin |
| POST | `/v1/admin/products/:id/images` | admin |
| GET | `/v1/categories` | public |
| GET | `/v1/categories/:slug` | public |
| GET | `/v1/cart` | cognito-jwt |
| POST | `/v1/cart/items` | cognito-jwt |
| PATCH | `/v1/cart/items/:productId` | cognito-jwt |
| DELETE | `/v1/cart/items/:productId` | cognito-jwt |
| DELETE | `/v1/cart` | cognito-jwt |
| GET | `/v1/wishlist` | cognito-jwt |
| POST | `/v1/wishlist/items` | cognito-jwt |
| DELETE | `/v1/wishlist/items/:productId` | cognito-jwt |
| POST | `/v1/orders` | cognito-jwt |
| GET | `/v1/orders` | cognito-jwt |
| GET | `/v1/orders/:orderId` | cognito-jwt / admin |
| GET | `/v1/products/:slug/reviews` | public |
| POST | `/v1/products/:slug/reviews` | cognito-jwt |
| DELETE | `/v1/reviews/:reviewId` | cognito-jwt / admin |
| GET | `/v1/me` | cognito-jwt |
| PATCH | `/v1/me` | cognito-jwt |
| GET | `/v1/me/addresses` | cognito-jwt |
| POST | `/v1/me/addresses` | cognito-jwt |
| DELETE | `/v1/me/addresses/:addressId` | cognito-jwt |
| GET | `/v1/search` | public |
| GET | `/v1/search/suggest` | public |
| POST | `/v1/payments/create-order` | cognito-jwt |
| POST | `/v1/payments/verify` | cognito-jwt |
| POST | `/v1/contact` | public |