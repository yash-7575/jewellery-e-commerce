#!/usr/bin/env bash
set -euo pipefail
API_ID=52e8sjfcp0
REGION=ap-south-1
AUTHORIZER=y50vh3
ACCOUNT=632759406732

# METHOD PATH HANDLER AUTH(public|protected)
routes=(
  "GET /v1/products products public"
  "GET /v1/products/{slug} products public"
  "POST /v1/admin/products products protected"
  "PUT /v1/admin/products/{id} products protected"
  "DELETE /v1/admin/products/{id} products protected"
  "POST /v1/admin/products/{id}/images products protected"
  "GET /v1/categories categories public"
  "GET /v1/categories/{slug} categories public"
  "GET /v1/cart cart protected"
  "POST /v1/cart/items cart protected"
  "PATCH /v1/cart/items/{productId} cart protected"
  "DELETE /v1/cart/items/{productId} cart protected"
  "DELETE /v1/cart cart protected"
  "GET /v1/wishlist wishlist protected"
  "POST /v1/wishlist/items wishlist protected"
  "DELETE /v1/wishlist/items/{productId} wishlist protected"
  "POST /v1/orders orders protected"
  "GET /v1/orders orders protected"
  "GET /v1/orders/{orderId} orders protected"
  "GET /v1/products/{slug}/reviews reviews public"
  "POST /v1/products/{slug}/reviews reviews protected"
  "DELETE /v1/reviews/{reviewId} reviews protected"
  "GET /v1/me user protected"
  "PATCH /v1/me user protected"
  "GET /v1/me/addresses user protected"
  "POST /v1/me/addresses user protected"
  "DELETE /v1/me/addresses/{addressId} user protected"
  "GET /v1/search search public"
  "GET /v1/search/suggest search public"
  "POST /v1/payments/create-order payments protected"
  "POST /v1/payments/verify payments protected"
  "POST /v1/contact contact public"
)

for r in "${routes[@]}"; do
  set -- $r
  method="$1"; path="$2"; handler="$3"; auth="$4"
  uri="arn:aws:lambda:ap-south-1:${ACCOUNT}:function:aaranya-${handler}"
  intid=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" --region "$REGION" \
    --integration-type AWS_PROXY \
    --integration-uri "$uri" \
    --payload-format-version 2.0 --output json | jq -r '.IntegrationId')
  if [ "$auth" = "protected" ]; then
    routeid=$(aws apigatewayv2 create-route \
      --api-id "$API_ID" --region "$REGION" \
      --route-key "$method $path" \
      --target "integrations/$intid" \
      --authorization-type JWT --authorizer-id "$AUTHORIZER" --output json | jq -r '.RouteId')
  else
    routeid=$(aws apigatewayv2 create-route \
      --api-id "$API_ID" --region "$REGION" \
      --route-key "$method $path" \
      --target "integrations/$intid" --output json | jq -r '.RouteId')
  fi
  echo "$method $path -> aaranya-${handler} (${auth}) route=$routeid"
done
echo "Routes done: ${#routes[@]}"