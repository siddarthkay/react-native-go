#!/bin/bash
# Copies project template files into cli/template/ for npm publishing.
# Run this before `npm publish` in the cli/ directory.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$SCRIPT_DIR/template"

echo "Building template from repo..."

rm -rf "$TEMPLATE_DIR"
mkdir -p "$TEMPLATE_DIR"

# Use rsync to copy while excluding build artifacts and dependencies
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='Pods' \
  --exclude='Podfile.lock' \
  --exclude='*.xcworkspace' \
  --exclude='build' \
  --exclude='.gradle' \
  --exclude='gradle/' \
  --exclude='.yarn/cache' \
  --exclude='.yarn/install-state.gz' \
  --exclude='gobridge.aar' \
  --exclude='Gobridge.xcframework' \
  --exclude='go.sum' \
  --exclude='.expo' \
  --exclude='.cxx' \
  --exclude='local.properties' \
  "$REPO_ROOT/backend" "$TEMPLATE_DIR/"

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='Pods' \
  --exclude='Podfile.lock' \
  --exclude='*.xcworkspace' \
  --exclude='build' \
  --exclude='.gradle' \
  --exclude='.yarn/cache' \
  --exclude='.yarn/install-state.gz' \
  --exclude='gobridge.aar' \
  --exclude='Gobridge.xcframework' \
  --exclude='.expo' \
  --exclude='.cxx' \
  --exclude='.claude' \
  --exclude='local.properties' \
  "$REPO_ROOT/mobile-app" "$TEMPLATE_DIR/"

cp "$REPO_ROOT/Makefile" "$TEMPLATE_DIR/Makefile"
cp "$REPO_ROOT/.gitignore" "$TEMPLATE_DIR/.gitignore"

echo "Template built at: $TEMPLATE_DIR"
