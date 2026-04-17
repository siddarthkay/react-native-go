{
  description = "React Native + Go development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        };

        # Android SDK configuration
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          buildToolsVersions = [ "33.0.0" "34.0.0" "35.0.0" ];
          platformVersions = [ "23" "33" "34" "35" ];
          abiVersions = [ "armeabi-v7a" "arm64-v8a" "x86" "x86_64" ];
          includeNDK = true;
          ndkVersions = [ "25.1.8937393" ];
          includeSystemImages = false;
          includeEmulator = false;
        };

        androidSdk = androidComposition.androidsdk;
      in
      {
        devShells.default = pkgs.mkShellNoCC {
          buildInputs = with pkgs; [
            # Node.js (yarn managed by project's corepack)
            nodejs_20

            # Go
            go

            # Build essentials
            git
            gnumake

            # Mobile development tools
            watchman

            # Android development
            androidSdk
            jdk17

            # Useful tools
            ripgrep
            jq
            curl
          ] ++ lib.optionals stdenv.isDarwin [
            cocoapods
            xcbeautify
          ];

          shellHook = ''
            # Enable Corepack so Yarn v4 (from packageManager field) is used
            export COREPACK_INSTALL_DIR="$HOME/.corepack-bin"
            mkdir -p "$COREPACK_INSTALL_DIR"
            corepack enable --install-directory "$COREPACK_INSTALL_DIR" 2>/dev/null || true
            export PATH="$COREPACK_INSTALL_DIR:$PATH"
            export COREPACK_ENABLE_STRICT=0

            # Create writable Android SDK directory
            export ANDROID_SDK_ROOT="$HOME/.android-sdk-nix"
            export ANDROID_HOME="$ANDROID_SDK_ROOT"

            # Rebuild if missing, or if any symlink is dangling (nix GC removed the store path)
            if [ ! -d "$ANDROID_SDK_ROOT" ] || [ ! -e "$ANDROID_SDK_ROOT/platforms/android-35" ] || [ ! -e "$ANDROID_SDK_ROOT/platform-tools" ]; then
              echo "Setting up Android SDK in $ANDROID_SDK_ROOT..."
              rm -rf "$ANDROID_SDK_ROOT"
              mkdir -p "$ANDROID_SDK_ROOT"
              cp -r ${androidSdk}/libexec/android-sdk/* "$ANDROID_SDK_ROOT/" 2>/dev/null || true
              chmod -R u+w "$ANDROID_SDK_ROOT" 2>/dev/null || true

              rm -rf "$ANDROID_SDK_ROOT/licenses" 2>/dev/null || true
              mkdir -p "$ANDROID_SDK_ROOT/licenses"
              mkdir -p "$ANDROID_SDK_ROOT/platforms"
              mkdir -p "$ANDROID_SDK_ROOT/build-tools"
              mkdir -p "$ANDROID_SDK_ROOT/ndk"

              echo "8933bad161af4178b1185d1a37fbf41ea5269c55" > "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
              echo "d56f5187479451eabf01fb78af6dfcb131a6481e" >> "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
              echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >> "$ANDROID_SDK_ROOT/licenses/android-sdk-license"
              echo "84831b9409646a918e30573bab4c9c91346d8abd" > "$ANDROID_SDK_ROOT/licenses/android-sdk-preview-license"
            fi

            export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/tools/bin:${androidSdk}/libexec/android-sdk/platform-tools:$PATH"

            # Install gomobile/gobind if not present
            export GOPATH="''${GOPATH:-$HOME/go}"
            export PATH="$GOPATH/bin:$PATH"
            if ! command -v gomobile &>/dev/null; then
              echo "Installing gomobile and gobind..."
              go install golang.org/x/mobile/cmd/gomobile@latest 2>/dev/null || true
              go install golang.org/x/mobile/cmd/gobind@latest 2>/dev/null || true
            fi

            # macOS: prefer system Xcode over Nix SDK
            # Nix injects C/C++ flags and compiler wrappers that conflict with Xcode builds.
            # Unsetting all Nix compiler-related env vars ensures xcodebuild uses Apple's toolchain.
            if [[ "$OSTYPE" == "darwin"* ]]; then
              unset DEVELOPER_DIR SDKROOT
              unset NIX_CFLAGS_COMPILE NIX_LDFLAGS NIX_ENFORCE_NO_NATIVE
              unset NIX_CC NIX_CXX NIX_BINTOOLS
              unset NIX_CFLAGS_COMPILE_FOR_TARGET NIX_LDFLAGS_FOR_TARGET
              export PATH="/usr/bin:$PATH"
              echo "  macOS: iOS and Android development available"
              echo "  CocoaPods: $(pod --version 2>/dev/null || echo 'not available')"
            else
              echo "  Linux: Android development only (iOS requires macOS)"
            fi

            echo "  Go: $(go version 2>/dev/null | cut -d' ' -f3)"
            echo "  Node: $(node --version)"
            echo "  Android SDK: $ANDROID_SDK_ROOT"
            echo "  Java: $(java -version 2>&1 | head -1)"
            echo ""
            echo "To get started:"
            echo "  make setup"
            if [[ "$OSTYPE" == "darwin"* ]]; then
              echo "  make ios    # or: make android"
            else
              echo "  make android"
            fi
            echo ""
          '';

          LANG = "en_US.UTF-8";
          NODE_OPTIONS = "--max-old-space-size=8192";
        };
      });
}
