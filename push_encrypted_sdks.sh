#!/bin/bash

echo "🚀 Starting Secure Deployment..."

RELEASE_DIR="/Users/malleravindra/Projucts/PingDart/PingDart-Releases"
mkdir -p "$RELEASE_DIR"

# 1. Clean old releases completely (except .git folder)
echo "🧹 Cleaning old release files..."
cd "$RELEASE_DIR" || exit 1
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# 2. Copy the exact folder structure from Sdks/
echo "📁 Copying repository structure..."
cp -r ../Sdks/* .

# 3. Run the Universal Obfuscator on all copied files
echo "🔒 Encrypting source code in all directories..."
cd ..
node obfuscate_all.js PingDart-Releases
cd PingDart-Releases

# 4. Push to GitHub
echo "☁️ Pushing encrypted folders to GitHub..."
if [ ! -d ".git" ]; then
    git init
    git config user.email "pingdart@gmail.com"
    git config user.name "Malle Ravindra"
    git remote add origin https://github.com/pingdart/PingDart-SDKs.git 2>/dev/null
fi

git add .
git commit -m "Automated Secure SDK Release (Fully Encrypted Folders)" || echo "No changes."
git branch -M main
git push -u origin main

echo "✅ Success! The GitHub repository now has the exact same folders, but all the code inside is encrypted!"
