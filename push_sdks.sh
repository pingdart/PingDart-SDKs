#!/bin/bash

echo "🚀 Starting One-Click GitHub Push for PingDart SDKs..."

# Navigate to the releases folder
cd /Users/malleravindra/Projucts/PingDart/PingDart-Releases || exit 1

# Check if git is already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing new Git repository..."
    git init
    git config user.email "pingdart@gmail.com"
    git config user.name "Malle Ravindra"
fi

# Add all files
echo "➕ Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Automated PingDart SDK Release" || echo "No new changes to commit."

# Set the branch to main
git branch -M main

# Add remote if it doesn't exist
git remote add origin https://github.com/pingdart/PingDart-SDKs.git 2>/dev/null || echo "Remote already exists."

# Push to GitHub
echo "☁️ Pushing to GitHub..."
git push -u origin main

echo "✅ Success! All SDKs have been pushed to https://github.com/pingdart/PingDart-SDKs"
