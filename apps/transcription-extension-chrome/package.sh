#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT_FILE="$DIST_DIR/transcription-extension-chrome.zip"

mkdir -p "$DIST_DIR"
rm -f "$OUTPUT_FILE"

cd "$ROOT_DIR"
zip -r "$OUTPUT_FILE" \
  manifest.json \
  background.js \
  content-google-meet.js \
  icons \
  mic-test.html \
  mic-test.js \
  popup.html \
  popup.js \
  README.md

echo "created $OUTPUT_FILE"
