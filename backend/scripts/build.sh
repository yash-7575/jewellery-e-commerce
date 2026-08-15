#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/handlers
for h in src/handlers/*.ts; do
  name=$(basename "$h" .ts)
  npx esbuild "$h" --bundle --platform=node --target=node20 --format=cjs --outfile="dist/handlers/$name.js" --external:@aws-sdk/*
  (cd dist/handlers && zip -q "$name.zip" "$name.js")
done
echo "Built $(ls dist/handlers/*.zip | wc -l) handler zips"