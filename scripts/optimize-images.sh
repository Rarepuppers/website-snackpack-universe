#!/usr/bin/env bash
# Downscales oversized site imagery to roughly 2x its largest rendered size.
# Everything here was shipping at full source resolution — phone screenshots at
# 1344px wide rendered into 164px grid cells, story covers at 1024px rendered
# at 178px. Scrolling /apps/ pulled ~71 MB.
#
# Targets (largest CSS render x2, rounded up):
#   screenshots      164px (apps hub) / 308px (homepage device fan) -> 800px
#   story covers     178px                                          -> 700px
#   feature graphics 517px, already 1024px                          -> unchanged
#
# Safe to re-run: ImageMagick's ">" flag only shrinks, never upscales.
# Run from the repo root: bash scripts/optimize-images.sh
set -euo pipefail

before=$(du -sk . 2>/dev/null | cut -f1)

echo "Resizing app screenshots to max 800px wide..."
find apps -type d -name screenshots -print0 | while IFS= read -r -d '' dir; do
  find "$dir" -type f \( -name '*.png' -o -name '*.jpg' \) -print0 |
    while IFS= read -r -d '' f; do
      magick "$f" -resize '800x800>' -strip -define png:compression-level=9 "$f"
    done
done

echo "Resizing story covers to max 700px wide..."
find assets/story-covers -type f \( -name '*.png' -o -name '*.jpg' \) -print0 |
  while IFS= read -r -d '' f; do
    magick "$f" -resize '700x700>' -strip -define png:compression-level=9 "$f"
  done

echo "Capping oversized app art (icons, game tiles) at 512px..."
find apps -type d -name assets -print0 | while IFS= read -r -d '' dir; do
  find "$dir" -type f -name '*.png' ! -name 'feature-graphic*' -print0 |
    while IFS= read -r -d '' f; do
      magick "$f" -resize '512x512>' -strip -define png:compression-level=9 "$f"
    done
done

after=$(du -sk . 2>/dev/null | cut -f1)
echo "repo: ${before}KB -> ${after}KB"
