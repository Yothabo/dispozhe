#!/bin/bash
set -e

echo "Building Chatie for Production"
echo "=============================="

echo "1. Building WebAssembly encryption module..."
cd encryption-rust
chmod +x build.sh
./build.sh

echo "2. Building frontend..."
cd ../frontend
npm install
npm run build

echo "3. Preparing distribution..."
mkdir -p ../dist
cp -r dist ../dist/frontend

echo "Production build complete!"
echo "Distribution ready in ./dist"
