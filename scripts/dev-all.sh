#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 1) Fix encodings first
bash "$ROOT_DIR/scripts/fix-encoding.sh"

# 2) Install deps (no audit/fund)
npm install --no-audit --no-fund

# 3) Free ports if busy
npx kill-port 5173 4000 || true

# 4) Run web, api, and bot in parallel
npx concurrently -n web,api,bot -c blue,green,magenta \
  "npm run -w @repo/web dev:web" \
  "npm run -w @repo/api dev:api" \
  "npm run -w slav-rpg-bot dev:bot"

