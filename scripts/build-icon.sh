#!/usr/bin/env bash
# Re-render the app icon from src-tauri/icons/icon.svg into all PNG sizes
# and the .icns bundle Tauri uses. Idempotent — safe to run on every edit
# of the master SVG.
#
# Requirements:
#   - node + sharp (SVG → 1024px PNG with proper alpha; sharp is a devDep)
#   - sips     (resize)         — macOS built-in
#   - iconutil (build .icns)    — macOS built-in
#
# Why not qlmanage: it formally writes RGBA but composites the
# transparent corners as opaque white, giving the dock icon white
# corners around the squircle.
#
# Usage:  ./scripts/build-icon.sh [path/to/icon.svg]
#
# Outputs:
#   src-tauri/icons/icon.icns          ← full .icns (10 sizes, 16–1024)
#   src-tauri/icons/icon.png           ← 1024 master PNG
#   src-tauri/icons/32x32.png          ← Tauri-listed individual sizes
#   src-tauri/icons/128x128.png
#   src-tauri/icons/128x128@2x.png

set -euo pipefail

# Resolve repo root from this script's location so it works from any cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SVG="${1:-$REPO_ROOT/src-tauri/icons/icon.svg}"
ICONS_DIR="$REPO_ROOT/src-tauri/icons"

if [[ ! -f "$SVG" ]]; then
  echo "error: SVG not found at $SVG" >&2
  exit 1
fi

# Use a unique work dir so concurrent runs don't clash
WORK="$(mktemp -d -t pomobuddy-icon)"
trap 'rm -rf "$WORK"' EXIT

echo "→ rendering $SVG @ 1024px (sharp, preserves alpha)"
SRC_PNG="$WORK/icon-1024.png"
node --input-type=module -e "
  import sharp from 'sharp';
  await sharp('$SVG')
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('$SRC_PNG');
"
if [[ ! -f "$SRC_PNG" ]]; then
  echo "error: sharp did not produce $SRC_PNG" >&2
  exit 1
fi

ISET="$WORK/icon.iconset"
mkdir -p "$ISET"

echo "→ generating .iconset sizes"
# size:name pairs — the @2x file at size N is just the PNG of size 2N
for pair in \
  "16:icon_16x16" \
  "32:icon_16x16@2x" \
  "32:icon_32x32" \
  "64:icon_32x32@2x" \
  "128:icon_128x128" \
  "256:icon_128x128@2x" \
  "256:icon_256x256" \
  "512:icon_256x256@2x" \
  "512:icon_512x512" \
  "1024:icon_512x512@2x"; do
  size="${pair%%:*}"
  name="${pair##*:}"
  sips -z "$size" "$size" "$SRC_PNG" --out "$ISET/$name.png" >/dev/null
done

echo "→ building icon.icns"
iconutil -c icns -o "$WORK/icon.icns" "$ISET"

echo "→ copying outputs into $ICONS_DIR"
mkdir -p "$ICONS_DIR"
cp "$ISET/icon_16x16@2x.png"   "$ICONS_DIR/32x32.png"
cp "$ISET/icon_128x128.png"    "$ICONS_DIR/128x128.png"
cp "$ISET/icon_128x128@2x.png" "$ICONS_DIR/128x128@2x.png"
cp "$SRC_PNG"                  "$ICONS_DIR/icon.png"
cp "$WORK/icon.icns"           "$ICONS_DIR/icon.icns"

echo "✓ done. Outputs:"
ls -la "$ICONS_DIR/icon.icns" "$ICONS_DIR/icon.png" "$ICONS_DIR/32x32.png" "$ICONS_DIR/128x128.png" "$ICONS_DIR/128x128@2x.png"
