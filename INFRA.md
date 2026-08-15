# AARANYA — AWS Infrastructure

**Region:** `ap-south-1` (Mumbai)
**Account ID:** `632759406732`
**Provisioned:** 2026-08-15 (provisioned via AWS CLI)
**Source of truth (data model):** `ARCHITECTURE.md`

All resources are prefixed `aaranya-`. Free-tier only; the single recurring cost is the Secrets Manager secret (~$0.40/mo). No VPC / NAT Gateway / ALB / RDS / EC2 / ElastiCache / ECS anywhere.

---

## 1. DynamoDB (on-demand, `PAY_PER_REQUEST`, all `ap-south-1`)

Multi-table design (9 tables). All tables are `ACTIVE` with all GSIs `ACTIVE`.

| Table | Key schema | GSIs | ARN |
|---|---|---|---|
| `aaranya-products` | HASH=`id` · RANGE=`sk` | `gsi_slug` (PK `slug`) · `gsi_category_price` (PK `category`, SK `price` N) · `gsi_category_created` (PK `category`, SK `createdAt`) · `gsi_metal_price` (PK `metal`, SK `price` N) · `gsi_gem_price` (PK `gemstone`, SK `price` N) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-products` |
| `aaranya-categories` | HASH=`id` · RANGE=`sk` | `gsi_slug` (PK `slug`) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-categories` |
| `aaranya-users` | HASH=`userId` · RANGE=`sk` | `gsi_email` (PK `email`) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-users` |
| `aaranya-orders` | HASH=`orderId` · RANGE=`sk` | `gsi_user_created` (PK `userId`, SK `createdAt`) · `gsi_orderitem_product` (PK `productId`) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-orders` |
| `aaranya-carts` | HASH=`userId` · RANGE=`sk` | — | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-carts` |
| `aaranya-wishlists` | HASH=`userId` · RANGE=`sk` | — | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-wishlists` |
| `aaranya-reviews` | HASH=`productId` · RANGE=`sk` | `gsi_user_created` (PK `userId`, SK `createdAt`) · `gsi_status` (PK `status`, SK `createdAt`) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-reviews` |
| `aaranya-search-tokens` | HASH=`shard` · RANGE=`sk` | — | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-search-tokens` |
| `aaranya-contact` | HASH=`contactId` · RANGE=`sk` | `gsi_email` (PK `email`) | `arn:aws:dynamodb:ap-south-1:632759406732:table/aaranya-contact` |

**Notes**
- All GSIs use `ProjectionType: ALL` (superset of the projected card fields in ARCHITECTURE.md §3.1 — functionally equivalent).
- **TTL enabled:** `aaranya-carts` → `ttl` (abandoned carts, 30 days); `aaranya-search-tokens` → `ttl` (disposable index).
- GSI ARN pattern for IAM/Lambda: `arn:aws:dynamodb:ap-south-1:632759406732:table/<table>/index/*`

---

## 2. S3 Media Bucket

| Field | Value |
|---|---|
| Name | `aaranya-media-40a233` (random 6-hex suffix 40a233) |
| Region | `ap-south-1` (LocationConstraint set) |
| ARN | `arn:aws:s3:::aaranya-media-40a233` |
| Access | **Private** — all public access blocked (`BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets` = true) |
| Encryption | **AES256** (S3-managed key, free) |
| Versioning | not enabled (per ARCHITECTURE.md §5 intent; can be enabled later if needed) |
| Website hosting | disabled |

**Bucket policy** — allows `s3:GetObject` to **CloudFront only**, via OAC (service principal + source ARN condition):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "cloudfront.amazonaws.com"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::aaranya-media-40a233/*",
    "Condition": {"StringEquals": {"AWS:SourceArn": "arn:aws:cloudfront::632759406732:distribution/E3H9KDMVRTOY29"}}
  }]
}
```

**Key layout** (per ARCHITECTURE.md §5 — create on upload): `products/<productId>/` (`original_<uuid>.*`, `hero.webp`, `gallery/<n>.webp`, `thumb/*`), `categories/<slug>.webp`, `reviews/<reviewId>/<n>.webp`, `users/<userId>/avatar.webp`.

---

## 3. CloudFront Media CDN (comment: `aaranya media CDN`)

| Field | Value |
|---|---|
| Distribution ID | `E3H9KDMVRTOY29` |
| Domain | **`d2wpw6wxp38zdc.cloudfront.net`** |
| Origin | S3 regional endpoint `aaranya-media-40a233.s3.ap-south-1.amazonaws.com` via **OAC** |
| OAC ID | `E2MH2ADBBMSZ0R` (name `aaranya-media-oac`, `sigv4`, signing behavior `always`, origin type `s3`) |
| Default cache behavior | GET/HEAD, viewer protocol `redirect-to-https`, cache policy `Managed-CachingOptimized` (`658327ea-f89d-4fab-a63d-7e88639e58f6`), compress on |
| Price class | `PriceClass_100` (free tier friendly, India/Asia edges) |
| Status | `InProgress` at write time — domain already assigned; waits ~10 min to `Deployed`. **Domain is usable immediately.** |
| Viewer auth | public (product imagery not gated) |

---

## 4. Cognito (ap-south-1)

| Field | Value |
|---|---|
| User pool name | `aaranya-users` |
| User pool ID | **`ap-south-1_RycmYFmKc`** |
| User pool ARN | `arn:aws:cognito-idp:ap-south-1:632759406732:userpool/ap-south-1_RycmYFmKc` |
| App client name | `aaranya-web` |
| App client ID | **`41ted5cpii690adcesq34r3dd8`** |
| Client secret | **None** (public client, `--no-generate-secret`) |
| Config | Sign-in alias `email` (email is the username), auto-verify email, required attrs `email` + `name`, MFA **OFF**, self-service signup (`AllowAdminCreateUserOnly=false`), password reset via email code, `PreventUserExistenceErrors=ENABLED` |
| Auth flows | `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |
| Password policy | min 8 chars, uppercase + lowercase + number + symbol, temporary validity 7 days |
| Admin group | not yet created — create group `admin` (`aws cognito-idp create-group --group-name admin --user-pool-id ap-south-1_RycmYFmKc`) and set `isAdmin=true` on the profile row when admin access is needed |

---

## 5. Secrets Manager

| Field | Value |
|---|---|
| Secret name | **`aaranya/razorpay`** |
| ARN | `arn:aws:secretsmanager:ap-south-1:632759406732:secret:aaranya/razorpay-rDQUxk` |
| SecretString | JSON `{"RAZORPAY_KEY_ID":"...","RAZORPAY_KEY_SECRET":"..."}` (values loaded from `.env` at provision time — **never printed/logged here**) |
| Access | Lambdas read via `secretsmanager:GetSecretValue` (policy attached to `aaranya-lambda-api`); fetch once at Lambda init + cache |
| Cost | ~$0.40/mo — the only guaranteed monthly line item |

---

## 6. IAM Roles

| Role | ARN | Managed policies | Inline policies |
|---|---|---|---|
| `aaranya-lambda-api` | `arn:aws:iam::632759406732:role/aaranya-lambda-api` | `service-role/AWSLambdaBasicExecutionRole` (CloudWatch Logs) | `DynamoDBAccess` · `SecretsRead` · `MediaS3` |
| `aaranya-lambda-thumbnail` | `arn:aws:iam::632759406732:role/aaranya-lambda-thumbnail` | `service-role/AWSLambdaBasicExecutionRole` | `MediaS3` |

**Trust policy (both):** `{"Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}`

- `DynamoDBAccess`: `GetItem, PutItem, UpdateItem, DeleteItem, Query, BatchGetItem, BatchWriteItem, TransactWriteItems` on every table ARN **and** every table's `index/*` GSI ARN (9 tables × 2).
- `SecretsRead`: `secretsmanager:GetSecretValue` on `arn:aws:secretsmanager:ap-south-1:632759406732:secret:aaranya/razorpay-rDQUxk`.
- `MediaS3` (both roles): `s3:GetObject, s3:PutObject` on `arn:aws:s3:::aaranya-media-40a233/*`.

---

## 7. Frontend Env Vars (Next.js — actual values)

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_RycmYFmKc
NEXT_PUBLIC_COGNITO_CLIENT_ID=41ted5cpii690adcesq34r3dd8
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d2wpw6wxp38zdc.cloudfront.net
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_RAZORPAY_KEY_ID=<from .env RAZORPAY_KEY_ID — client-safe, already public>
```

**Pending:** `NEXT_PUBLIC_COGNITO_DOMAIN`, `NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN`, `NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT`. These need the Cognito domain (`aws cognito-idp create-user-pool-domain`), which remains open. `NEXT_PUBLIC_API_BASE_URL` is now set — see §11.

---

## 8. Lambda Env Vars (server-side, injected by IaC)

The task's shorthand map:

```
TABLE_NAME=aaranya-products          (primary/entry table; see full list below)
MEDIA_BUCKET=aaranya-media-40a233
RAZORPAY_SECRET_NAME=aaranya/razorpay
AWS_REGION=ap-south-1
```

Full per-table map per ARCHITECTURE.md §8 (use these in actual Lambda env):

```
AWS_REGION=ap-south-1
PRODUCTS_TABLE=aaranya-products
CATEGORIES_TABLE=aaranya-categories
USERS_TABLE=aaranya-users
ORDERS_TABLE=aaranya-orders
CARTS_TABLE=aaranya-carts
WISHLISTS_TABLE=aaranya-wishlists
REVIEWS_TABLE=aaranya-reviews
SEARCH_TABLE=aaranya-search-tokens
CONTACT_TABLE=aaranya-contact
MEDIA_BUCKET=aaranya-media-40a233
CLOUDFRONT_DOMAIN=d2wpw6wxp38zdc.cloudfront.net
COGNITO_USER_POOL_ID=ap-south-1_RycmYFmKc
COGNITO_USER_POOL_CLIENT_ID=41ted5cpii690adcesq34r3dd8
RAZORPAY_SECRETS_ARN=arn:aws:secretsmanager:ap-south-1:632759406732:secret:aaranya/razorpay-rDQUxk
LOG_LEVEL=info
```

---

## 9. Teardown (reverse order, exact commands)

> Replace `region=ap-south-1` inline on every command. Do **IAM last** (roles are referenced by nothing once Lambdas/CF are gone), and **DynamoDB/S3** are the "cheap" leftovers — delete them too.

```bash
REGION=ap-south-1

# 1. CloudFront distribution (must delete BEFORE OAC)
aws cloudfront delete-distribution --id E3H9KDMVRTOY29 --if-match "$(aws cloudfront get-distribution --id E3H9KDMVRTOY29 --query ETag --output text)"

# 2. Origin Access Control
aws cloudfront delete-origin-access-control --id E2MH2ADBBMSZ0R --if-match "$(aws cloudfront get-origin-access-control --id E2MH2ADBBMSZ0R --query ETag --output text)"

# 3. S3 bucket (remove object lock/versioning/objects first if any exist)
aws s3 rb s3://aaranya-media-40a233 --force --region $REGION

# 4. Secrets Manager secret
aws secretsmanager delete-secret --region $REGION --secret-id aaranya/razorpay --force-delete-without-recovery

# 5. Cognito app client + user pool (client is deleted with the pool)
aws cognito-idp delete-user-pool --region $REGION --user-pool-id ap-south-1_RycmYFmKc

# 6. DynamoDB tables
for t in aaranya-products aaranya-categories aaranya-users aaranya-orders aaranya-carts aaranya-wishlists aaranya-reviews aaranya-search-tokens aaranya-contact; do
  aws dynamodb delete-table --region $REGION --table-name $t
done

# 7. IAM roles (inline policies delete with the role; detach managed first)
aws iam detach-role-policy --role-name aaranya-lambda-api --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name aaranya-lambda-thumbnail --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name aaranya-lambda-api
aws iam delete-role --role-name aaranya-lambda-thumbnail
```

---

## 11. HTTP API Gateway (Lambda backend — deployed)

| Field | Value |
|---|---|
| API name | `aaranya-api` |
| API ID | **`52e8sjfcp0`** |
| Invoke URL | **`https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod`** (stage `prod`, auto-deploy) |
| Protocol | HTTP (`--protocol-type HTTP`), payload format v2.0, integrations `AWS_PROXY` |
| CORS | `AllowOrigins=["*"]` (see Known Issue 6), `AllowMethods=GET,POST,PUT,DELETE,OPTIONS`, `AllowHeaders=Content-Type,Authorization` |
| Authorizer | **`cognito-jwt`** id **`y50vh3`** — JWT, identity source `$request.header.Authorization`, Audience `41ted5cpii690adcesq34r3dd8`, Issuer `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_RycmYFmKc` |
| Routes | 32 (per API_CONTRACT.md base `/v1`; 11 public, 21 protected via authorizer `y50vh3`) |

**Lambdas → ARNs** (`nodejs20.x`, role `aaranya-lambda-api`, timeout 10s, memory 256MB, PERMISSION: `lambda:InvokeFunction` for `apigateway.amazonaws.com` on `arn:aws:execute-api:ap-south-1:632759406732:52e8sjfcp0/*/*`):

| Lambda | ARN |
|---|---|
| `aaranya-products` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-products` |
| `aaranya-categories` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-categories` |
| `aaranya-cart` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-cart` |
| `aaranya-orders` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-orders` |
| `aaranya-payments` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-payments` |
| `aaranya-reviews` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-reviews` |
| `aaranya-search` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-search` |
| `aaranya-user` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-user` |
| `aaranya-wishlist` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-wishlist` |
| `aaranya-contact` | `arn:aws:lambda:ap-south-1:632759406732:function:aaranya-contact` |

**Lambda env (set at create time):** `AWS_REGION=ap-south-1` (self-managed by Lambda — not settable), `MEDIA_BUCKET=aaranya-media-40a233`, `RAZORPAY_SECRET_NAME=aaranya/razorpay`, `TABLE_PRODUCTS=aaranya-products`, `TABLE_CATEGORIES=aaranya-categories`, `TABLE_CARTS=aaranya-carts`, `TABLE_ORDERS=aaranya-orders`, `TABLE_USERS=aaranya-users`, `TABLE_WISHLISTS=aaranya-wishlists`, `TABLE_REVIEWS=aaranya-reviews`, `TABLE_CONTACT=aaranya-contact`, `TABLE_SEARCH_TOKENS=aaranya-search-tokens`.

**Frontend env var:**

```
NEXT_PUBLIC_API_BASE_URL=https://52e8sjfcp0.execute-api.ap-south-1.amazonaws.com/prod
```

**Smoke-tested 2026-08-15:** `GET /v1/products` → 200 (20 items), `GET /v1/products/{slug}` → 200, `GET /v1/categories` → 200, `GET /v1/categories/{slug}` → 200, `GET /v1/search?q=...` / `/v1/search/suggest?q=...` → 200, protected route (e.g. `/v1/cart`) without a token → 401 (authorizer enforced). Public routes are served under `/v1/*` (e.g. `/prod/v1/products`).

---

## 12. Teardown additions (API Gateway + Lambdas — run before §9 IAM/DynamoDB)

```bash
REGION=ap-south-1
API=52e8sjfcp0

# API Gateway (stage deletion happens with the API)
aws apigatewayv2 delete-api --region $REGION --api-id $API

# Lambdas (10)
for fn in aaranya-products aaranya-categories aaranya-cart aaranya-orders aaranya-payments aaranya-reviews aaranya-search aaranya-user aaranya-wishlist aaranya-contact; do
  aws lambda delete-function --region $REGION --function-name $fn
done
```

---

## 13. Known Issues

1. **CloudFront still `InProgress`** at provision time (`E3H9KDMVRTOY29`). The domain `d2wpw6wxp38zdc.cloudfront.net` is already assigned and routable, but full `Deployed` takes ~5–15 min. Nothing to do unless the CDN must serve before then.
2. **Managed policy ARN gotcha:** `AWSLambdaBasicExecutionRole` lives under the AWS `service-role` path — the ARN is `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`. First attach attempt with the non-`service-role` ARN failed (`NoSuchEntity`, harmless) and was re-run correctly.
3. **Cognito `acl`/`GenerateSecret` fields** return `null`/absent in `describe-user-pool-client` output for this account/API version — client **was** created with `--no-generate-secret` and no `ClientSecret` is returned, confirming a secretless public client.
4. ~~**No API Gateway, no Lambda functions, no Cognito domain, no `admin` group yet**~~ — API Gateway `52e8sjfcp0` + authorizer `y50vh3` + all 32 routes + 10 Lambdas are now deployed (§11). Still open: Cognito hosted-UI domain and the `admin` group.
5. **S3 versioning not enabled** — enabled in the ARCHITECTURE doc's bucket intent; left off to stay maximally free-tier. Flip it on (`aws s3api put-bucket-versioning --bucket aaranya-media-40a233 --versioning-configuration Status=Enabled`) if media rollback matters.
6. **CORS `AllowOrigins` is `["*"]`** — the task-specified list (`http://localhost:3000`, `https://*.vercel.app`) was rejected by API Gateway because wildcard host patterns like `https://*.vercel.app` are not valid in `remove:AllowOrigins`. Since no credentials/cookies are used, `*` is functionally equivalent. Re-lock to explicit origins later if creds are ever required.
7. **Authorizer returns 401 `{"message":"Unauthorized"}` without a token** — expected; it means the JWT authorizer is correctly protecting the private routes.