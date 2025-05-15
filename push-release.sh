#!/bin/bash

set -e

echo "🔄 Syncing versions..."
node scripts/sync-versions.mjs

VERSION=$(cat .version)
COMMIT_MSG="🚀 Release v$VERSION"

echo "📦 Committing version $VERSION"
git add .version **/package.json
git commit -m "$COMMIT_MSG"

echo "📤 Pushing to GitHub..."
git push

echo "🏷 Creating Git tag v$VERSION"
git tag v$VERSION
git push origin v$VERSION

echo "✅ Done! GitHub Actions will now publish v$VERSION."

