# WiFi Scanner 3D - Immersive Cross-Platform Wi-Fi Visualization

> Real-time 3D visualization of nearby Wi-Fi signals with device orientation support

[![.NET MAUI](https://img.shields.io/badge/.NET%20MAUI-8.0-purple)](https://dotnet.microsoft.com/apps/maui)
[![Blazor](https://img.shields.io/badge/Blazor-Hybrid-blue)](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-6.0-orange)](https://www.babylonjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Overview

WiFi Scanner 3D is a cross-platform mobile and desktop application that scans for nearby Wi-Fi networks and visualizes them in an immersive 3D environment. Unlike traditional Wi-Fi scanner apps that show flat lists or 2D maps, this app creates a spatial "radar-like" experience where signals appear as glowing, pulsing spheres around you.

The app uses your device's orientation sensors so that when you turn, the 3D scene rotates accordingly, making it feel like you're looking around at the invisible Wi-Fi signals in the air.

### Key Features

- ✨ **Immersive 3D Visualization** - Signals appear as glowing spheres with particle effects
- 🧭 **Orientation-Driven** - Turn your device to rotate the view (on mobile)
- 📱 **Cross-Platform** - Runs on Android, iOS, Windows, and macOS
- 🔒 **Local-First** - No backend, no cloud, no data collection
- 🎨 **Real-Time Updates** - Scene updates as new networks are detected
- 🎮 **Interactive Camera** - Mouse/touch controls for desktop and fallback
- 📊 **Live Metrics** - See signal strength, network count, and orientation data
- 🧪 **Mock Mode** - Test visualization without real Wi-Fi scanning

### Screenshots

*(Add screenshots here once the app is running)*

## Quick Start

### Prerequisites

- [.NET 8.0 SDK](https://dot.net/download)
- Visual Studio 2022 17.8+ (Windows/Mac) or VS Code with C# Dev Kit
- For Android: Android SDK 23+
- For iOS: macOS with Xcode 15+
- For Windows: Windows 10 1809+ or Windows 11

### Run in 5 Minutes

```bash
# Clone the repository
git clone https://github.com/yourusername/wifi-scanner-adventure.git
cd wifi-scanner-adventure

# Restore dependencies
dotnet restore

# Run on Android (emulator or device)
dotnet build -t:Run -f net8.0-android

# Or run on Windows
dotnet build -t:Run -f net8.0-windows10.0.19041.0
```

See [docs/BUILD.md](docs/BUILD.md) for detailed build instructions for each platform.

## Platform Support

| Platform | Wi-Fi Scanning | Orientation | Status |
|----------|----------------|-------------|--------|
| **Android** | ✅ Real | ✅ Real | Fully Supported |
| **iOS** | ⚠️ Mock | ✅ Real | Limited (iOS restrictions) |
| **Windows** | ✅ Real | ⚠️ Mock | Fully Supported |
| **macOS** | ⚠️ Mock | ✅ Real | Partially Supported |

**Note**: iOS severely restricts Wi-Fi scanning APIs, so the iOS version uses a mock provider that generates realistic test data. All visualization and sensor features work normally.

## Architecture

This project uses a **hybrid architecture**:

- **.NET MAUI 8.0** - Cross-platform app framework for native device access
- **Blazor Hybrid** - UI framework running natively (not in a WebView)
- **Babylon.js** - High-performance 3D rendering via JavaScript interop
- **Clean Architecture** - Domain models, interfaces, and platform-specific implementations

```
├── WiFiScanner.Domain      # Core models and interfaces
├── WiFiScanner.Core         # Business logic and mock providers
└── WiFiScanner.App          # MAUI Blazor Hybrid app
    ├── Platforms/           # Platform-specific implementations
    ├── Components/          # Blazor UI components
    ├── Services/            # Scanning coordinator
    └── wwwroot/             # Babylon.js visualization
```

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How It Works

### 1. Wi-Fi Scanning

On supported platforms (Android, Windows), the app uses native APIs to scan for nearby Wi-Fi networks:

- **Android**: Uses `WifiManager` with location permissions
- **Windows**: Uses `Windows.Devices.WiFi.WiFiAdapter`
- **iOS/macOS**: Falls back to mock provider (Apple restrictions)

### 2. Signal Aggregation

Scan results are aggregated over time:
- RSSI (signal strength) history is maintained
- Smoothing applied to reduce noise
- Access points expire after 30 seconds of no updates

### 3. Orientation Tracking

Device orientation is captured using:
- **Mobile**: Compass and gyroscope sensors via MAUI APIs
- **Desktop**: Mouse-based camera control (sensors unavailable)

### 4. 3D Visualization

Babylon.js renders an immersive scene:
- Each Wi-Fi network appears as a glowing sphere
- Signal strength determines size, color, and particle emission
- Strong signals are green and large; weak signals are red and small
- Camera rotates based on device orientation or mouse input

## Usage

1. **Launch the app** on your device
2. **Grant permissions** when prompted (location on Android, Wi-Fi on Windows)
3. **Tap "Start Scanning"** to begin
4. **Watch the 3D scene** populate with nearby Wi-Fi signals
5. **Turn your device** (mobile) or **drag with mouse** (desktop) to look around
6. **Tap "Stop Scanning"** to pause

### Controls

- **Mobile**: Turn device to rotate view, pinch to zoom
- **Desktop**: Drag to rotate, scroll to zoom

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Complete architecture and design decisions
- [BUILD.md](docs/BUILD.md) - Build and run instructions for all platforms
- [VISUALIZATION.md](docs/VISUALIZATION.md) - 3D rendering design and implementation

## Roadmap

### v1.0 (Current)
- [x] Real-time Wi-Fi scanning (Android, Windows)
- [x] 3D spatial visualization with Babylon.js
- [x] Device orientation support (mobile)
- [x] Mock providers for unsupported platforms
- [x] Signal strength color coding
- [x] Particle effects for visual interest

### v1.1 (Next)
- [ ] Signal history recording and replay
- [ ] Export scan data (JSON, CSV)
- [ ] Network details panel
- [ ] Custom color schemes
- [ ] Performance settings (quality presets)

### v2.0 (Future)
- [ ] GPS integration for geospatial mode
- [ ] Heatmap visualization mode
- [ ] Triangulation for position estimation
- [ ] AR overlay mode (iOS/Android)
- [ ] Backend sync (optional)
- [ ] Multi-user collaborative mapping

## Known Issues

- **Android 9+**: Wi-Fi scanning is throttled to ~4 scans/minute in foreground
- **iOS**: No real Wi-Fi scanning due to Apple restrictions (mock mode only)
- **Windows**: Orientation sensors not available on most PCs (mouse control)

## FAQ

**Q: Why doesn't iOS show real Wi-Fi networks?**
A: Apple restricts Wi-Fi scanning APIs. Only the currently connected network is accessible. We use a mock provider for testing.

**Q: Why does Android need location permission?**
A: Android 6+ requires location permission for Wi-Fi scanning (to prevent location tracking via BSSID).

**Q: Does this app collect any data?**
A: No. Everything runs locally on your device. No network requests, no telemetry, no tracking.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Babylon.js](https://www.babylonjs.com/) for the excellent 3D engine
- [.NET MAUI](https://dotnet.microsoft.com/apps/maui) team for cross-platform framework
- [Blazor](https://blazor.net/) team for hybrid app support

---

**Made with ❤️ using .NET MAUI and Babylon.js**