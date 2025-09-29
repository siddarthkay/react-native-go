#!/bin/bash

set -e

echo "Building Go-React Native iOS App..."

# Build the Go backend using Makefile
echo "Building Go backend for iOS..."
cd ../backend
make ios

if [ $? -ne 0 ]; then
  echo "Failed to build Go backend for iOS"
  exit 1
fi

echo "Go backend built successfully"

# Return to mobile-app directory
cd ../mobile-app

# Install pods if needed
echo "Installing CocoaPods dependencies..."
cd ios
pod install

if [ $? -ne 0 ]; then
  echo "Failed to install CocoaPods dependencies"
  exit 1
fi

cd ..

echo "Starting Expo iOS build..."
npx expo run:ios