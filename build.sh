#!/usr/bin/env bash
# Build script — runs locally and on Azure SWA's Oryx (Node + npm).
# Outputs final static site to ./build/ which Oryx detects as React build dir.
set -euo pipefail

echo "→ Cleaning previous build"
rm -rf build dist
mkdir -p dist build/dist

echo "→ Bundling JS with esbuild"
esbuild src/app.jsx --bundle --minify --outfile=dist/bundle.js --target=es2020

echo "→ Building CSS with Tailwind"
tailwindcss -i src/input.css -o dist/style.css --minify

echo "→ Staging build/ for deploy"
cp dist/bundle.js dist/style.css build/dist/
cp index.html build/

# Copy any top-level static assets that exist
for f in dashboard.html \
         galtrix-logo-mark.svg \
         galtrix-logo.svg \
         galtrix-logo.png \
         galtrix-logo-transparent.png \
         galtrix-logo-animated.webp \
         "Galtrix Official Logo.pdf" \
         README.md; do
  if [ -f "$f" ]; then
    cp "$f" build/
  fi
done

echo "✓ Build complete — output in ./build/"
ls -la build/
