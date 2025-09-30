GO ?= go
GOPATH ?= $(shell $(GO) env GOPATH)
GOROOT ?= $(shell $(GO) env GOROOT)
GOMOBILE ?= $(GOPATH)/bin/gomobile
GOBIND ?= $(GOPATH)/bin/gobind

MOBILE_PKG_SRC = $(GOPATH)/src/golang.org/x/mobile

ANDROID_OUTPUT = ../mobile-app/android/app/libs/gobridge.aar
IOS_OUTPUT = ../mobile-app/ios/Frameworks/Gobridge.xcframework

ANDROID_API = 23

.PHONY: all setup android ios clean check-go install-gomobile setup-mobile-src

all: android

setup: check-go install-gomobile setup-mobile-src
	@echo "Setup complete!"

check-go:
	@echo "Checking Go installation..."
	@if ! command -v $(GO) > /dev/null 2>&1; then \
		echo "Error: Go not found. Please install Go 1.24+"; \
		echo "Visit: https://golang.org/dl/"; \
		exit 1; \
	fi
	@echo "Go found: $(shell $(GO) version)"
	@echo "GOROOT: $(GOROOT)"
	@echo "GOPATH: $(GOPATH)"

install-gomobile:
	@echo "Installing gomobile and gobind..."
	@$(GO) install golang.org/x/mobile/cmd/gomobile@latest
	@$(GO) install golang.org/x/mobile/cmd/gobind@latest
	@echo "Gomobile installed at: $(GOMOBILE)"
	@echo "Gobind installed at: $(GOBIND)"

setup-mobile-src:
	@echo "Setting up golang.org/x/mobile source..."
	@echo "Downloading mobile module to cache..."
	@$(GO) mod download golang.org/x/mobile
	@if [ ! -d "$(MOBILE_PKG_SRC)" ]; then \
		echo "Creating symlink from module cache to GOPATH/src..."; \
		mkdir -p $(GOPATH)/src/golang.org/x; \
		MOBILE_CACHE=$$(find $(shell $(GO) env GOMODCACHE)/golang.org/x -maxdepth 1 -name "mobile@*" -type d | head -1); \
		if [ -n "$$MOBILE_CACHE" ] && [ -d "$$MOBILE_CACHE" ]; then \
			ln -sf $$MOBILE_CACHE $(MOBILE_PKG_SRC); \
			echo "Symlink created: $(MOBILE_PKG_SRC) -> $$MOBILE_CACHE"; \
		else \
			echo "Cloning golang.org/x/mobile as fallback..."; \
			git clone https://go.googlesource.com/mobile $(MOBILE_PKG_SRC); \
		fi \
	else \
		echo "Mobile source already exists at $(MOBILE_PKG_SRC)"; \
	fi
	@echo "Initializing gomobile..."
	@GOPATH=$(GOPATH) PATH=$(GOPATH)/bin:$(GOROOT)/bin:$$PATH $(GOMOBILE) init
	@echo "Mobile package setup complete"

check-setup:
	@echo "Verifying build environment..."
	@if ! command -v $(GO) > /dev/null 2>&1; then \
		echo "Error: Go not found. Run 'make setup'"; \
		exit 1; \
	fi
	@if [ ! -f "$(GOMOBILE)" ]; then \
		echo "Error: gomobile not found. Run 'make setup'"; \
		exit 1; \
	fi
	@if [ ! -d "$(MOBILE_PKG_SRC)" ]; then \
		echo "Error: mobile source not found. Run 'make setup'"; \
		exit 1; \
	fi
	@echo "Build environment OK"

android: check-setup
	@echo "Building Android AAR..."
	@mkdir -p $(dir $(ANDROID_OUTPUT))
	@$(GO) mod download
	@GOPATH=$(GOPATH) PATH=$(GOPATH)/bin:$(MOBILE_PKG_SRC):$(GOROOT)/bin:$$PATH $(GOMOBILE) bind \
		-target=android \
		-androidapi $(ANDROID_API) \
		-o $(ANDROID_OUTPUT) \
		./
	@echo "✓ Android AAR built successfully at $(ANDROID_OUTPUT)"

ios: check-setup
	@echo "Building iOS XCFramework..."
	@mkdir -p $(dir $(IOS_OUTPUT))
	@$(GO) mod download
	@GOPATH=$(GOPATH) PATH=$(GOPATH)/bin:$(MOBILE_PKG_SRC):$(GOROOT)/bin:$$PATH $(GOMOBILE) bind \
		-target=ios \
		-o $(IOS_OUTPUT) \
		./
	@echo "✓ iOS XCFramework built successfully at $(IOS_OUTPUT)"

clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(ANDROID_OUTPUT)
	@rm -rf $(IOS_OUTPUT)
	@echo "✓ Clean complete"

clean-all: clean
	@echo "Cleaning all dependencies and cache..."
	@rm -rf $(MOBILE_PKG_SRC)
	@$(GO) clean -modcache
	@echo "✓ Full clean complete"

test:
	@echo "Running tests..."
	@$(GO) test -v ./...

fmt:
	@echo "Formatting code..."
	@$(GO) fmt ./...

vet:
	@echo "Running go vet..."
	@$(GO) vet ./...

help:
	@echo "Available targets:"
	@echo "  make setup        - Install all dependencies (gomobile, mobile source)"
	@echo "  make android      - Build Android AAR"
	@echo "  make ios          - Build iOS XCFramework"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make clean-all    - Remove build artifacts and dependencies"
	@echo "  make check-setup  - Verify build environment"
	@echo "  make test         - Run Go tests"
	@echo "  make fmt          - Format Go code"
	@echo "  make vet          - Run go vet"