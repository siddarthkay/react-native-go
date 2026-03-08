#!/bin/bash
# Copies project template files into cli/template/ for npm publishing.
# Converts real identifiers to {{PLACEHOLDER}} markers.
# Run this before `npm publish` in the cli/ directory.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="$SCRIPT_DIR/template"

echo "Building template from repo..."

rm -rf "$TEMPLATE_DIR"
mkdir -p "$TEMPLATE_DIR"

# Copy backend (excluding build artifacts)
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

# Copy mobile-app (excluding build artifacts)
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
cp "$REPO_ROOT/project.config.json" "$TEMPLATE_DIR/project.config.json"

# Convert real identifiers to {{PLACEHOLDER}} markers in text files
echo "Converting identifiers to placeholders..."

# Order matters: longer/more-specific strings first to avoid partial replacements
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

find "$TEMPLATE_DIR" -type f \
  ! -name "*.png" ! -name "*.jpg" ! -name "*.jpeg" ! -name "*.gif" ! -name "*.ico" \
  ! -name "*.jar" ! -name "*.aar" ! -name "*.keystore" \
  -exec $SED_INPLACE \
    -e 's|github.com/siddarthkay/react-native-go|{{GO_MODULE}}|g' \
    -e 's|io\.rngolang\.app|{{BUNDLE_ID}}|g' \
    -e 's|io/rngolang/app|{{BUNDLE_PATH}}|g' \
    -e 's|rn-golang|{{APP_NAME}}|g' \
    -e 's|mobileapp|{{IOS_PROJECT}}|g' \
    {} +

# Rename iOS directories and files to use placeholders
mv "$TEMPLATE_DIR/mobile-app/ios/mobileapp.xcodeproj/xcshareddata/xcschemes/mobileapp.xcscheme" \
   "$TEMPLATE_DIR/mobile-app/ios/mobileapp.xcodeproj/xcshareddata/xcschemes/{{IOS_PROJECT}}.xcscheme"

# Rename files inside iOS project dir
for f in "$TEMPLATE_DIR/mobile-app/ios/mobileapp/"*mobileapp*; do
  [ -e "$f" ] || continue
  newname=$(basename "$f" | sed 's/mobileapp/{{IOS_PROJECT}}/g')
  mv "$f" "$TEMPLATE_DIR/mobile-app/ios/mobileapp/$newname"
done

# Rename iOS directories
mv "$TEMPLATE_DIR/mobile-app/ios/mobileapp.xcodeproj" "$TEMPLATE_DIR/mobile-app/ios/{{IOS_PROJECT}}.xcodeproj"
mv "$TEMPLATE_DIR/mobile-app/ios/mobileapp" "$TEMPLATE_DIR/mobile-app/ios/{{IOS_PROJECT}}"

# Rename Android package directory to {{BUNDLE_PATH}}
ANDROID_JAVA="$TEMPLATE_DIR/mobile-app/android/app/src/main/java"
mkdir -p "$ANDROID_JAVA/{{BUNDLE_PATH}}"
mv "$ANDROID_JAVA/io/rngolang/app/"* "$ANDROID_JAVA/{{BUNDLE_PATH}}/"
rm -rf "$ANDROID_JAVA/io"

# Clean up macOS sed backup files
find "$TEMPLATE_DIR" -name "*''" -delete 2>/dev/null || true

echo "Template built at: $TEMPLATE_DIR"
