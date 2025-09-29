# Backend Makefile for Go-React Native Bridge

# Detect Go installation
GO_VERSION = 1.24.0
GOROOT ?= $(shell go env GOROOT)
ifeq ($(wildcard $(HOME)/sdk/go$(GO_VERSION)),)
    # Go 1.24 not found in SDK, try default
    GO = go
else
    # Use Go 1.24 from SDK
    GOROOT = $(HOME)/sdk/go$(GO_VERSION)
    GO = $(GOROOT)/bin/go
endif

# Detect gomobile
GOMOBILE = $(shell which gomobile 2>/dev/null)
ifeq ($(GOMOBILE),)
    # Try local go/bin
    GOMOBILE = $(HOME)/go/bin/gomobile
endif

# Output paths
ANDROID_OUTPUT = ../mobile-app/android/app/libs/gobridge.aar
IOS_OUTPUT = ../mobile-app/ios/Frameworks/Gobridge.xcframework

# Android API level
ANDROID_API = 23

.PHONY: all android ios clean check-deps install-deps

all: android

check-deps:
	@echo "Checking dependencies..."
	@echo "Go path: $(GO)"
	@echo "GOROOT: $(GOROOT)"
	@echo "Gomobile path: $(GOMOBILE)"
	@if [ ! -f "$(GO)" ]; then \
		echo "Error: Go not found at $(GO)"; \
		exit 1; \
	fi
	@if [ ! -f "$(GOMOBILE)" ]; then \
		echo "Error: gomobile not found. Installing..."; \
		$(MAKE) install-deps; \
	fi
	@echo "All dependencies found"

install-deps:
	@echo "Installing gomobile..."
	GOROOT=$(GOROOT) $(GO) install golang.org/x/mobile/cmd/gomobile@latest
	@echo "Initializing gomobile..."
	GOROOT=$(GOROOT) PATH=$(HOME)/go/bin:$(GOROOT)/bin:$$PATH $(GOMOBILE) init
	@echo "Gomobile installed successfully"

android: check-deps
	@echo "Building Android AAR..."
	@mkdir -p $(dir $(ANDROID_OUTPUT))
	GOROOT=$(GOROOT) PATH=$(HOME)/go/bin:$(GOROOT)/bin:$$PATH $(GOMOBILE) bind \
		-target=android \
		-androidapi $(ANDROID_API) \
		-o $(ANDROID_OUTPUT) \
		./
	@echo "Android AAR built successfully at $(ANDROID_OUTPUT)"

ios: check-deps
	@echo "Building iOS XCFramework..."
	@mkdir -p $(dir $(IOS_OUTPUT))
	GOROOT=$(GOROOT) PATH=$(HOME)/go/bin:$(GOROOT)/bin:$$PATH $(GOMOBILE) bind \
		-target=ios \
		-o $(IOS_OUTPUT) \
		./
	@echo "iOS XCFramework built successfully at $(IOS_OUTPUT)"

clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(ANDROID_OUTPUT)
	@rm -rf $(IOS_OUTPUT)
	@echo "Clean complete"

# Development helpers
test:
	@echo "Running tests..."
	$(GO) test -v ./...

fmt:
	@echo "Formatting code..."
	$(GO) fmt ./...

vet:
	@echo "Running go vet..."
	$(GO) vet ./...