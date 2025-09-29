#!/bin/bash

set -e

echo "Building Go-React Native Android App..."

# Build the Go backend using Makefile
echo "Building Go backend..."
cd ../backend
make android

if [ $? -ne 0 ]; then
  echo "Failed to build Go backend"
  exit 1
fi

echo "Go backend built successfully"

# Return to mobile-app directory
cd ../mobile-app

echo "Starting Expo Android build..."
npx expo run:android

