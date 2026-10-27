#!/usr/bin/env bash
# Builds the static demo preview into preview/. Production uses `npm run build`.
# A static export can't run server code, so the API routes and the account
# guard (proxy.ts) are set aside, along with robots.ts and sitemap.ts, which
# need route segment config that Cache Components does not allow.
set -euo pipefail
cd "$(dirname "$0")/.."
stash=$(mktemp -d)
restore() {
  [ -e "$stash/robots.ts" ] && mv "$stash/robots.ts" "$stash/sitemap.ts" src/app/
  [ -e "$stash/api" ] && mv "$stash/api" src/app/
  [ -e "$stash/proxy.ts" ] && mv "$stash/proxy.ts" src/
  rmdir "$stash"
}
trap restore EXIT
mv src/app/robots.ts src/app/sitemap.ts src/app/api src/proxy.ts "$stash"/
rm -rf out .next  # stale route types would point at the set-aside API files
NEXT_PUBLIC_PREVIEW=1 NEXT_PUBLIC_DEMO_MODE=1 PREVIEW_EXPORT=1 npx next build
node scripts/package-preview.mjs
