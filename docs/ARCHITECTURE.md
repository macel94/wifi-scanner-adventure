# Architecture Decision

## Chosen Stack

### TypeScript + Three.js (Primary Visualization)

The immersive 3D visualization is built with **TypeScript** and **Three.js**, bundled with **Vite**.

**Why TypeScript + Three.js over Blazor:**

- **Three.js** is the most mature, battle-tested 3D rendering library for the web, with extensive support for shaders, particles, post-processing, and camera systems.
- **Blazor WebGL** has no equivalent ecosystem for immersive 3D. While Blazor can call JS interop, wrapping Three.js through Blazor adds latency and complexity with no benefit for a GPU-intensive render loop.
- **DeviceOrientation API** is natively available in the browser, making sensor integration seamless.
- TypeScript provides strong typing, excellent tooling, and direct access to WebGL without marshaling overhead.
- The visualization runs at 60fps in a tight `requestAnimationFrame` loop — Blazor's rendering model is not designed for this.

**Why not pure Blazor:**

- Blazor excels at form-heavy, data-driven UIs — not real-time 3D rendering.
- The overhead of .NET-to-JS interop in a 60fps loop would degrade performance.
- No mature Blazor-native 3D library exists.

### .NET MAUI (Native Shell + Acquisition)

**.NET MAUI** provides the native app shell for:

- Wi-Fi scanning via platform APIs (Android `WifiManager`, iOS `NEHotspotHelper`)
- Device sensor access via `Microsoft.Maui.Devices.Sensors`
- Hosting the Three.js visualization inside a `WebView`
- Platform permission management

**Why .NET MAUI:**

- Cross-platform native access from a single C# codebase
- Strong integration with the .NET ecosystem
- WebView hosting allows embedding the Three.js renderer
- Clean interface-based architecture maps naturally to .NET DI

### .NET Domain Libraries

Shared domain models and interfaces are in standalone .NET class libraries:

- `WifiScanner.Domain` — models, interfaces, contracts
- `WifiScanner.Acquisition` — scanner implementations (mock + native)

These build on any .NET 9+ runtime without MAUI workloads.

## Architecture Layers

```
┌─────────────────────────────────────────────┐
│              UI / Controls                   │
│         (HTML overlay + CSS)                 │
├─────────────────────────────────────────────┤
│         3D Visualization Engine              │
│      (Three.js scene, camera, effects)       │
├─────────────────────────────────────────────┤
│         Sensor Manager                       │
│   (DeviceOrientation / Mouse fallback)       │
├─────────────────────────────────────────────┤
│         Scan Manager                         │
│     (Mock provider / Native bridge)          │
├─────────────────────────────────────────────┤
│         Core Domain Models                   │
│   (WifiAccessPoint, ScanResult, etc.)        │
├─────────────────────────────────────────────┤
│    Native Shell (MAUI WebView host)          │
│     (Wi-Fi API, sensors, permissions)        │
└─────────────────────────────────────────────┘
```

## Data Flow

1. **Acquisition**: Mock provider generates simulated Wi-Fi scan results (or native bridge receives them from MAUI)
2. **Normalization**: Scan results are normalized into `WifiAccessPoint` domain objects
3. **State Management**: `ScanManager` maintains current signal snapshot with smoothing
4. **Visualization**: `SignalVisualizer` maps access points to 3D visual objects
5. **Camera**: `CameraController` responds to device orientation or mouse input
6. **Render Loop**: `AnimationLoop` drives 60fps updates, interpolating between states

## Key Design Decisions

- **No fake precision**: Since we cannot determine the physical direction of access points without triangulation, signals are distributed in a visually meaningful pattern (orbital shells by signal strength) rather than pretending to know exact positions.
- **Smooth transitions**: All visual updates use interpolation (lerp/slerp) to avoid jarring jumps.
- **Decoupled scan/render**: The scan frequency (every ~3s) is independent of the render loop (60fps).
- **Provider pattern**: All data sources implement interfaces, making it trivial to swap mock for real.
- **Local-first**: Zero network dependencies. Everything runs on-device.
