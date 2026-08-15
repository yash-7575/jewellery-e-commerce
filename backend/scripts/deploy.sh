#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

REGION=ap-south-1
ROLE_ARN=arn:aws:iam::632759406732:role/aaranya-lambda-api
ENV="MEDIA_BUCKET=aaranya-media-40a233,RAZORPAY_SECRET_NAME=aaranya/razorpay,TABLE_PRODUCTS=aaranya-products,TABLE_CATEGORIES=aaranya-categories,TABLE_CARTS=aaranya-carts,TABLE_ORDERS=aaranya-orders,TABLE_USERS=aaranya-users,TABLE_WISHLISTS=aaranya-wishlists,TABLE_REVIEWS=aaranya-reviews,TABLE_CONTACT=aaranya-contact,TABLE_SEARCH_TOKENS=aaranya-search-tokens"

for z in dist/handlers/*.zip; do
  name=$(basename "$z" .zip)
  fn="aaranya-$name"
  if aws lambda get-function --function-name "$fn" --region "$REGION" >/dev/null 2>&1; then
    echo "Updating $fn"
    aws lambda update-function-code --function-name "$fn" --zip-file "fileb://$z" --region "$REGION" --output json | jq -r '.LastModified'
  else
    echo "Creating $fn"
    aws lambda create-function \
      --function-name "$fn" \
      --runtime nodejs20.x \
      --handler "$name.handler" \
      --role "$ROLE_ARN" \
      --zip-file "fileb://$z" \
      --timeout 10 \
      --memory-size 256 \
      --environment "Variables={$ENV}" \
      --region "$REGION" --output json | jq -r '.FunctionArn'
  fi
done
echo "Deploy complete"