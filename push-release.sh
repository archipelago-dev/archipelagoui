#!/bin/bash

set -e

echo "🔄 Syncing versions..."
node sync-versions.mjs

VERSION=$(cat .version)
COMMIT_MSG="🚀 Release v$VERSION"

echo "📦 Committing version $VERSION"
git add .version **/package.json .
git commit -m "$COMMIT_MSG"

echo "📤 Pushing changes..."
git push

echo "🏷 Tagging version..."
git tag v$VERSION
git push origin v$VERSION

echo "📦 Publishing @archipelagoui/archipelago..."
  # adjust if different
pnpm publish --access public


echo "📦 Publishing archy-cli..."
cd cli  # adjust if different
pnpm publish --access public
cd ..

echo "✅ All done! Version v$VERSION published to npm."
