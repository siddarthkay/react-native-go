# create-react-native-go

Scaffold a React Native + Go mobile app in seconds. Go runs as an embedded HTTP server providing JSON-RPC APIs, while React Native handles the UI with the New Architecture (Fabric + TurboModules).

## Usage

```bash
npx create-react-native-go my-app --bundleId com.mycompany.myapp --goModule mycompany.com/my-app
cd my-app
make setup
make ios    # or: make android
```

If you omit any flags, the CLI will prompt you interactively.

## What You Get

```
my-app/
├── Makefile                        # Root orchestrator
├── backend/
│   ├── Makefile                    # Go build targets
│   ├── mobile_api.go               # Mobile API for server lifecycle
│   └── http_server.go              # JSON-RPC HTTP server
└── mobile-app/
    ├── Makefile                    # Mobile build targets
    ├── src/
    │   ├── NativeGoServerBridge.ts # TurboModule spec
    │   ├── GoServerBridgeJSI.ts    # JSI wrapper
    │   └── JsonRpcClient.ts        # JSON-RPC client
    ├── android/                    # Android native code
    └── ios/                        # iOS native code
```

## Prerequisites

- Node.js 18+
- Go 1.25+
- iOS: Xcode 15+, CocoaPods
- Android: Android Studio, JDK 17+

## Options

| Flag | Description | Example |
|------|-------------|---------|
| `--bundleId` | App bundle identifier | `com.mycompany.myapp` |
| `--goModule` | Go module path | `mycompany.com/my-app` |

The first positional argument is the app name (e.g. `my-app`).

## How It Works

The CLI copies a pre-built template and replaces all identifiers (app name, bundle ID, Go module path, iOS project name, Android package directories) to match your configuration. It then initializes a fresh git repo.

## Links

- [GitHub Repository](https://github.com/siddarthkay/react-native-go)
- [Issues](https://github.com/siddarthkay/react-native-go/issues)

## License

MIT
