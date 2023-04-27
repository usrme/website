#!/usr/bin/env bash

MDBOOK_VERSION="v0.4.28"

echo "Removing potentially existing mdBook build directory"
rm -rf src/pages/snippets

echo "Downloading mdBook ${MDBOOK_VERSION} and unpacking"
curl -sL "https://github.com/rust-lang/mdBook/releases/download/${MDBOOK_VERSION}/mdbook-${MDBOOK_VERSION}-x86_64-unknown-linux-gnu.tar.gz" |
  tar -xz

echo "Building site"
npm run build

echo "Building snippets"
mdbook build

echo "Copying built snippets to 'public/'"
cp -aR src/pages/snippets/* public/

echo "Reverting changes made to favicon"
git restore public/favicon.svg
