#!/bin/bash

echo "🚀 Starting Python Encryption Build..."

# Clean old builds
rm -rf dist build src/*.egg-info obfuscated_src

# Encrypt the source code using PyArmor
echo "🔒 Encrypting Python files with PyArmor..."
/Users/malleravindra/Library/Python/3.9/bin/pyarmor gen -O obfuscated_src src/pingdartdb

# Swap source directories
echo "🔄 Swapping clear-text with obfuscated code..."
mv src src_backup
mv obfuscated_src src

# Build the Wheel and Tarball
echo "📦 Building the distribution..."
python3 -m build

# Restore the clear-text source directory
echo "↩️ Restoring clear-text source..."
rm -rf src
mv src_backup src

echo "✅ Build Complete! Encrypted packages are in the 'dist' folder."
