#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Building WebAssembly encryption module..."

if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    cargo install wasm-pack
fi

rm -rf pkg

# Build without the incorrect feature flag
wasm-pack build --target web --release

if command -v wasm-opt &> /dev/null; then
    wasm-opt -O4 -o pkg/chatie_encryption_bg.wasm pkg/chatie_encryption_bg.wasm
fi

mkdir -p ../frontend/src/lib/encryption/wasm

cp pkg/chatie_encryption.js ../frontend/src/lib/encryption/wasm/
cp pkg/chatie_encryption_bg.wasm ../frontend/src/lib/encryption/wasm/
cp pkg/chatie_encryption.d.ts ../frontend/src/lib/encryption/wasm/

echo "export const WASM_VERSION = '0.1.0';" > ../frontend/src/lib/encryption/wasm/version.ts

echo "WebAssembly encryption module built successfully!"
