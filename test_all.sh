#!/bin/bash

# Central test runner for all PingDart SDKs

echo "🚀 Starting PingDart SDK Automated Tests..."

# 1. Node.js / JS
echo "---------------------------------------"
echo "📦 Testing pingdart-node..."
cd pingdart-node && NODE_OPTIONS=--experimental-vm-modules npx jest test/sdk.test.js
cd ..

# 2. Python
echo "---------------------------------------"
echo "🐍 Testing pingdart-python..."
cd pingdart-python && export PYTHONPATH=$PYTHONPATH:. && pytest
cd ..

# 3. PHP
echo "---------------------------------------"
echo "🐘 Testing pingdart-php (Syntax Check)..."
cd pingdart-php && php -l src/PingDartSDK.php && php -l src/Services/*.php
cd ..

# 4. Go
echo "---------------------------------------"
echo "🐹 Testing pingdart-go..."
cd pingdart-go && go test ./...
cd ..

# 5. Dart
echo "---------------------------------------"
echo "🎯 Testing pingdart-dart..."
cd pingdart-dart && dart test
cd ..

# 6. Java
echo "---------------------------------------"
echo "☕ Testing pingdart-java..."
cd pingdart-java && mvn test
cd ..

echo "---------------------------------------"
echo "✅ All tests completed!"
