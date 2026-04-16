YARN ?= yarn
GRADLEW = android/gradlew
ANDROID_APK = android/app/build/outputs/apk/release/app-release.apk

CONFIG_FILE ?= ../project.config.json
IOS_PROJECT ?= $(shell jq -r '.iosProjectName' $(CONFIG_FILE) 2>/dev/null || echo "mobileapp")
XCODE_WORKSPACE = ios/$(IOS_PROJECT).xcworkspace
XCODE_SCHEME = $(IOS_PROJECT)
XCODE_DERIVEDDATA = ios/build

.PHONY: node-install pod-install ios build-ios android build-android run-ios run-android clean-ios clean-android clean help

node-install:
	@echo "Installing Node dependencies..."
	@$(YARN) install
	@echo "✓ Node dependencies installed"

pod-install:
	@echo "Installing CocoaPods dependencies..."
	@cd ios && pod install
	@echo "✓ CocoaPods installed"

ios: node-install pod-install build-ios

build-ios:
	@echo "Building iOS Simulator app..."
	@set -o pipefail && xcodebuild -workspace $(XCODE_WORKSPACE) \
		-scheme $(XCODE_SCHEME) \
		-sdk iphonesimulator \
		-configuration Release \
		-destination 'generic/platform=iOS Simulator' \
		-derivedDataPath $(XCODE_DERIVEDDATA) \
		CODE_SIGNING_ALLOWED=NO \
		ARCHS=arm64 \
		ONLY_ACTIVE_ARCH=YES \
		$(if $(shell command -v xcbeautify 2>/dev/null),| xcbeautify,)
	@echo "✓ iOS app built at $(XCODE_DERIVEDDATA)/Build/Products/Release-iphonesimulator/$(IOS_PROJECT).app"

android: node-install build-android

build-android:
	@echo "Building Android Release APK..."
	@chmod +x $(GRADLEW)
	@cd android && ./gradlew assembleRelease --no-daemon
	@echo "✓ Android APK built at $(ANDROID_APK)"

run-ios:
	@npx expo run:ios

run-android:
	@npx expo run:android

clean-ios:
	@echo "Cleaning iOS build..."
	@rm -rf $(XCODE_DERIVEDDATA)
	@echo "✓ iOS clean complete"

clean-android:
	@echo "Cleaning Android build..."
	@cd android && ./gradlew clean --no-daemon 2>/dev/null || true
	@echo "✓ Android clean complete"

clean: clean-ios clean-android

help:
	@echo "Available targets:"
	@echo "  make node-install   - Install Node dependencies"
	@echo "  make pod-install    - Install CocoaPods dependencies"
	@echo "  make ios            - Install deps + build iOS Simulator app"
	@echo "  make build-ios      - Build iOS Simulator app (deps must be installed)"
	@echo "  make android        - Install deps + build Android Release APK"
	@echo "  make build-android  - Build Android Release APK (deps must be installed)"
	@echo "  make run-ios        - Start iOS dev build via Expo"
	@echo "  make run-android    - Start Android dev build via Expo"
	@echo "  make clean-ios      - Clean iOS build artifacts"
	@echo "  make clean-android  - Clean Android build artifacts"
	@echo "  make clean          - Clean all build artifacts"
