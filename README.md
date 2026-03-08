# 🛜 Wi-Fi Scanner Adventure

An immersive 3D Wi-Fi signal visualization app that scans for nearby wireless networks and renders them as a real-time spatial radar, driven by device orientation sensors.

## Architecture

**TypeScript + Three.js** for the 3D immersive visualization, with **.NET** domain libraries for native integration.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **3D Visualization** | TypeScript + Three.js + Vite | Immersive radar scene with signal nodes |
| **Domain Models** | .NET 9 / TypeScript | Shared Wi-Fi and sensor data contracts |
| **Acquisition** | Mock provider / Native bridge | Wi-Fi scan data sources |
| **Sensors** | DeviceOrientation API / Mouse | Camera orientation control |
| **Native Shell** | .NET MAUI (template) | Future WebView host for mobile |

### Why This Stack?

- **Three.js** is the most mature WebGL library for real-time 3D — ideal for a 60fps immersive radar
- **Blazor** was rejected because its rendering model is not designed for GPU-intensive animation loops
- **TypeScript** provides strong typing with direct WebGL access and no marshaling overhead
- **.NET** provides the domain model layer and future native platform integration via MAUI
- The visualization runs standalone in any browser, and can be embedded in a MAUI WebView for mobile

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture decision record.

## Features

- ✅ **Immersive 3D radar** — Wi-Fi signals rendered as glowing, pulsing spheres in 3D space
- ✅ **Signal-driven positioning** — Stronger signals appear closer; weaker signals orbit farther out
- ✅ **Band-separated visualization** — 2.4 GHz, 5 GHz, and 6 GHz networks at different heights
- ✅ **Color-coded signal quality** — Green (strong) → Yellow → Red (weak)
- ✅ **Device orientation** — Rotating the device rotates the camera naturally
- ✅ **Mouse fallback** — Click-and-drag orbit control on desktop
- ✅ **Real-time updates** — Scans every 3 seconds, renders at 60fps with smooth interpolation
- ✅ **Start/stop scanning** — Toggle scanning on and off
- ✅ **Mock/native toggle** — Switch between simulated and real Wi-Fi data
- ✅ **Live metrics panel** — Network count, strongest signal, band distribution
- ✅ **Debug overlay** — FPS, orientation angles, sensor state (Ctrl+D)
- ✅ **Smooth transitions** — RSSI smoothing, position lerp, scale animation
- ✅ **Fade-out on disappear** — Networks that go out of range fade out gracefully

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (22+ recommended)
- [.NET 9 SDK](https://dotnet.microsoft.com/) (for domain libraries)

### Run the 3D Visualization

```bash
cd src/visualization
npm install
npm run dev
```

Open http://localhost:3000 in your browser. The app starts scanning with mock data automatically.

### Build for Production

```bash
cd src/visualization
npm run build
npm run preview
```

### Run Tests

```bash
# TypeScript tests (21 tests)
cd src/visualization
npm test

# .NET tests (14 tests)
cd src/dotnet
dotnet test
```

### Type Check

```bash
cd src/visualization
npm run typecheck
```

## Project Structure

```
├── docs/
│   ├── ARCHITECTURE.md          # Architecture decision record
│   └── PLATFORM-SUPPORT.md     # Platform capability matrix
├── src/
│   ├── visualization/           # TypeScript + Three.js app
│   │   ├── index.html           # App shell with embedded styles
│   │   ├── package.json         # Node dependencies
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── vite.config.ts       # Vite bundler config
│   │   ├── vitest.config.ts     # Test configuration
│   │   └── src/
│   │       ├── main.ts          # App entry point and bootstrapper
│   │       ├── core/
│   │       │   ├── models.ts    # Domain types and utilities
│   │       │   └── interfaces.ts # Service contracts and EventEmitter
│   │       ├── acquisition/
│   │       │   ├── mock-provider.ts    # Simulated Wi-Fi scan data
│   │       │   ├── bridge-provider.ts  # Native WebView bridge receiver
│   │       │   └── scan-manager.ts     # Scan orchestrator with smoothing
│   │       ├── sensors/
│   │       │   ├── orientation-provider.ts # DeviceOrientation API
│   │       │   ├── mouse-provider.ts       # Mouse orbit fallback
│   │       │   └── sensor-manager.ts       # Sensor detection and fallback
│   │       ├── renderer/
│   │       │   ├── scene-manager.ts       # Three.js scene setup
│   │       │   ├── signal-visualizer.ts   # Wi-Fi → 3D node mapping
│   │       │   ├── camera-controller.ts   # Orientation-driven camera
│   │       │   └── animation-loop.ts      # 60fps render loop
│   │       └── ui/
│   │           ├── controls-panel.ts      # Start/stop, provider toggle
│   │           ├── metrics-panel.ts       # Live signal statistics
│   │           └── debug-overlay.ts       # FPS, orientation, node count
│   └── dotnet/
│       ├── WifiScanner.sln
│       ├── WifiScanner.Domain/           # Shared domain models
│       │   ├── Models/
│       │   │   ├── WifiAccessPoint.cs
│       │   │   ├── WifiScanResult.cs
│       │   │   ├── SignalSnapshot.cs
│       │   │   └── OrientationData.cs
│       │   └── Interfaces/
│       │       ├── IWifiScanner.cs
│       │       ├── IOrientationProvider.cs
│       │       └── ISignalProvider.cs
│       ├── WifiScanner.Acquisition/      # Scan provider implementations
│       │   └── Providers/
│       │       ├── MockWifiScanner.cs
│       │       └── AndroidWifiScanner.cs
│       └── WifiScanner.Domain.Tests/     # Unit tests
│           ├── WifiAccessPointTests.cs
│           └── MockWifiScannerTests.cs
└── README.md
```

## What Is Real vs Mocked

| Component | Browser (v1) | Mobile (future) |
|-----------|-------------|-----------------|
| **Wi-Fi scan data** | 🟡 Mock — 15 simulated networks with realistic RSSI jitter | 🟢 Real via MAUI native bridge |
| **3D rendering** | 🟢 Real — Three.js WebGL | 🟢 Real — WebView |
| **Device orientation** | 🟢 Real on mobile browsers / 🟡 Mouse fallback on desktop | 🟢 Real via DeviceOrientation API |
| **Signal positioning** | 🟡 Deterministic orbital — BSSID hash to angle, RSSI to distance | Same until triangulation is added |
| **RSSI values** | 🟡 Simulated with realistic ranges and jitter | 🟢 Real from platform API |

## Controls

| Action | Input |
|--------|-------|
| **Rotate view** | Click and drag (desktop) / Tilt device (mobile) |
| **Start/Stop scan** | Bottom center button |
| **Toggle mock/native** | Bottom center toggle |
| **Debug overlay** | Ctrl+D |

## Rendering Design

### Scene Graph
- **Environment**: Dark background, fog, grid floor, orbital distance rings, starfield
- **Signal nodes**: Per-AP group containing core sphere, glow sphere, pulse ring, point light, label sprite

### Signal-to-Visual Mapping
- **Distance from center**: Inversely proportional to RSSI (stronger = closer)
- **Angle**: Deterministic hash of BSSID (stable position per AP)
- **Height**: Band-separated (2.4 GHz = ground, 5 GHz = elevated, 6 GHz = high)
- **Size**: Proportional to normalized signal strength
- **Color**: HSL gradient from green (strong) through yellow to red (weak)
- **Glow intensity**: Proportional to signal strength
- **Pulse rate**: Continuous sine-wave animation per node

### Performance
- Render loop decoupled from scan frequency (60fps vs 3s scans)
- Position/scale interpolation for smooth transitions
- Pixel ratio capped at 2x to prevent GPU overload on high-DPI screens
- Fog and distance culling limit draw calls

## Next Steps

1. **Historical recording** — Record scan snapshots for playback
2. **Replay mode** — Scrub through recorded signal history
3. **Signal field estimation** — Use multiple scans to estimate AP direction/distance
4. **Local backend** — Optional local API for data persistence
5. **Geospatial mode** — Overlay on real-world coordinates with GPS
6. **AR mode** — Camera passthrough with signal overlay
7. **Triangulation** — Multi-point signal strength to estimate AP position
8. **MAUI integration** — Embed visualization in native app with real Wi-Fi scanning

## Platform Support

See [docs/PLATFORM-SUPPORT.md](docs/PLATFORM-SUPPORT.md) for detailed platform capabilities.

## License

MIT