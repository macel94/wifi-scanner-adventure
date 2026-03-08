# WiFi Scanner 3D - Immersive Cross-Platform Wi-Fi Visualization

A real-time, immersive 3D visualization app for nearby Wi-Fi signals that uses device orientation and sensors to create a spatial "radar-like" experience.

## Architecture Overview

This solution implements a **hybrid architecture** combining:

- **.NET MAUI 8.0** for cross-platform native capabilities
- **Blazor Hybrid** for the UI layer (native performance, not WebView)
- **Babylon.js** for high-performance 3D rendering via JavaScript interop
- **Clean Architecture** with clear separation of concerns

### Why This Stack?

1. **Wi-Fi Scanning**: .NET MAUI provides direct platform APIs for Android and Windows. iOS severely restricts Wi-Fi scanning, so we use a mock provider there.

2. **Sensor Access**: .NET MAUI has excellent cross-platform sensor APIs (compass, gyroscope, accelerometer).

3. **3D Rendering**: Babylon.js is battle-tested for WebGL rendering and provides better performance than Blazor WebGL for complex particle systems and real-time updates.

4. **Blazor Hybrid**: Provides seamless integration between C# business logic and JavaScript rendering without WebView overhead.

5. **Local-First**: Everything runs on-device with no backend dependencies.

## Platform Support Matrix

| Platform | Wi-Fi Scanning | Orientation Sensors | 3D Rendering | Implementation Status |
|----------|----------------|---------------------|--------------|----------------------|
| **Android** | ✅ Real (API 23+) | ✅ Real (Compass, Gyroscope) | ✅ Full | Real implementation with WifiManager |
| **iOS** | ⚠️ Mock only | ✅ Real (Compass, Gyroscope) | ✅ Full | iOS restricts Wi-Fi scanning - mock provider used |
| **Windows** | ✅ Real | ⚠️ Mock only | ✅ Full | Real implementation with Windows.Devices.WiFi |
| **macOS** | ⚠️ Mock only | ✅ Real | ✅ Full | Mock provider (similar restrictions to iOS) |

### Platform Caveats

**Android**:
- Requires location permissions (ACCESS_FINE_LOCATION)
- Wi-Fi must be enabled
- Scanning may be throttled on Android 9+ (limited to ~4 scans per minute in foreground)
- Works best on Android 6.0 (API 23) and above

**iOS**:
- Apple severely restricts Wi-Fi scanning APIs
- Only shows currently connected network
- Mock provider generates realistic test data for development
- All sensor features work normally

**Windows**:
- Requires "Proximity" capability in manifest
- Works on Windows 10 1809+ and Windows 11
- Desktop orientation sensors typically unavailable (uses mock)
- Mouse-based camera control for testing

**macOS**:
- Similar restrictions to iOS via Mac Catalyst
- Mock provider for Wi-Fi scanning
- Real sensors available on MacBooks with built-in sensors

## Solution Structure

```
/
├── WiFiScanner.sln                          # Solution file
├── src/
│   ├── WiFiScanner.Domain/                  # Core domain models and interfaces
│   │   ├── Models/
│   │   │   ├── WiFiScanResult.cs           # Single scan result
│   │   │   ├── WiFiAccessPoint.cs          # Aggregated AP data
│   │   │   ├── OrientationData.cs          # Device orientation
│   │   │   └── SignalSnapshot.cs           # Snapshot of all signals
│   │   └── Interfaces/
│   │       ├── IWiFiScanner.cs             # Wi-Fi scanning contract
│   │       ├── IOrientationProvider.cs     # Orientation/sensor contract
│   │       └── IVisualizationAdapter.cs    # Visualization contract
│   │
│   ├── WiFiScanner.Core/                    # Cross-platform business logic
│   │   └── Services/
│   │       ├── MockWiFiScanner.cs          # Mock Wi-Fi scanner
│   │       ├── MockOrientationProvider.cs   # Mock orientation provider
│   │       └── SignalAggregator.cs         # Signal aggregation & smoothing
│   │
│   └── WiFiScanner.App/                     # MAUI Blazor Hybrid app
│       ├── Components/
│       │   ├── App.razor                    # Root Blazor component
│       │   ├── Routes.razor                 # Routing configuration
│       │   └── Pages/
│       │       └── Home.razor               # Main visualization page
│       ├── Platforms/
│       │   ├── Android/
│       │   │   ├── AndroidWiFiScanner.cs   # Android-specific Wi-Fi implementation
│       │   │   ├── AndroidManifest.xml     # Android permissions
│       │   │   ├── MainActivity.cs
│       │   │   └── MainApplication.cs
│       │   ├── iOS/
│       │   │   ├── AppDelegate.cs
│       │   │   └── Program.cs
│       │   └── Windows/
│       │       ├── WindowsWiFiScanner.cs   # Windows-specific Wi-Fi implementation
│       │       └── App.xaml/cs
│       ├── Services/
│       │   ├── MauiOrientationProvider.cs  # MAUI sensor integration
│       │   └── ScanningCoordinator.cs      # Coordinates scanning & aggregation
│       ├── wwwroot/
│       │   ├── index.html                   # HTML host
│       │   ├── css/app.css                  # Styling
│       │   └── js/visualization.js          # Babylon.js 3D engine
│       ├── Resources/                       # MAUI resources (icons, splash, fonts)
│       ├── MauiProgram.cs                   # App configuration & DI
│       └── WiFiScanner.App.csproj
└── docs/
    ├── ARCHITECTURE.md                      # This file
    ├── BUILD.md                             # Build instructions
    └── VISUALIZATION.md                     # 3D rendering details
```

## Domain Model

### Core Entities

**WiFiScanResult** - A single scan result from the platform API
- Normalized signal strength (0.0-1.0)
- RSSI in dBm
- Timestamp
- Optional frequency, channel, security info

**WiFiAccessPoint** - Aggregated data for a specific access point (by BSSID)
- Maintains RSSI history for smoothing
- Tracks first seen / last seen timestamps
- Provides smoothed signal strength

**OrientationData** - Device orientation at a point in time
- Heading (compass direction)
- Pitch (tilt forward/back)
- Roll (tilt left/right)
- Optional quaternion for advanced 3D

**SignalSnapshot** - Complete state at a moment
- Collection of all access points
- Current orientation
- Timestamp

### Interfaces

**IWiFiScanner** - Platform-agnostic Wi-Fi scanning
- `StartScanningAsync()` / `StopScanningAsync()`
- `ScanResultsAvailable` event
- `IsSupported` flag

**IOrientationProvider** - Platform-agnostic orientation tracking
- `StartTrackingAsync()` / `StopTrackingAsync()`
- `OrientationChanged` event
- `CurrentOrientation` property

**IVisualizationAdapter** - Rendering abstraction (currently JavaScript interop)
- `UpdateSignals(snapshot)`
- `UpdateOrientation(orientation)`

## Data Flow

```
[Platform Wi-Fi API] → IWiFiScanner → ScanResultsAvailable event
                                            ↓
                                    SignalAggregator
                                            ↓
                                  Smoothing & Aggregation
                                            ↓
                                    SnapshotUpdated event
                                            ↓
                          [Blazor Component (Home.razor)]
                                            ↓
                                    JSON Serialization
                                            ↓
                          [JavaScript Interop (IJSRuntime)]
                                            ↓
                          [Babylon.js Visualization Engine]
                                            ↓
                              Update meshes, particles, colors

[Device Sensors] → IOrientationProvider → OrientationChanged event
                                                ↓
                                        Blazor Component
                                                ↓
                                          JS Interop
                                                ↓
                                    Babylon.js Camera Rotation
```

## Permissions and Runtime Flow

### Android

1. App requests `ACCESS_FINE_LOCATION` via MAUI Permissions API
2. User grants or denies permission
3. If granted, `AndroidWiFiScanner` registers `BroadcastReceiver` for scan results
4. `WifiManager.startScan()` called every 3 seconds
5. `onReceive()` callback processes scan results
6. Results normalized and emitted via `ScanResultsAvailable` event

### iOS

1. No special permissions needed (using mock provider)
2. `MockWiFiScanner` generates realistic test data
3. Sensor permissions handled automatically by MAUI

### Windows

1. App requests `WiFiAdapter.RequestAccessAsync()`
2. User grants access in system dialog
3. `WindowsWiFiScanner` uses `WiFiAdapter.ScanAsync()`
4. Scans every 3 seconds, results from `NetworkReport`

## Visualization Design

### 3D Scene Graph

```
Scene (dark blue background)
├── Camera (ArcRotateCamera, orbit mode)
│   └── Controlled by device orientation OR mouse
├── Lights
│   ├── HemisphericLight (ambient)
│   └── PointLight (at origin)
├── Ground Plane (wireframe grid, semi-transparent)
├── Central Marker (pulsing cylinder = user position)
└── Signal Meshes (one per Wi-Fi access point)
    ├── Sphere (size/color based on signal strength)
    ├── Material (emissive, color-coded)
    └── Particle System (pulsing particles)
```

### Signal-to-Visual Mapping

- **Position**: Distributed in a circle around the user (randomized distance 10-18 units)
- **Height**: Slight vertical randomization for visual interest
- **Size**: 0.5-2.0 scale based on signal strength
- **Color**:
  - Strong (>70%): Green (#4ade80)
  - Medium (40-70%): Yellow (#fbbf24)
  - Weak (<40%): Red (#ef4444)
- **Particles**: Emission rate 20-100 based on strength
- **Animation**: Slow floating up/down (2-second cycle)

### Camera Behavior

- **Orbit Mode**: Mouse/touch drag to rotate view
- **Orientation Mode**: Device heading directly controls camera alpha (yaw)
- **Smooth Interpolation**: Linear interpolation (lerp) with 0.1 factor for smooth transitions
- **Zoom**: Mouse wheel or pinch gesture (5-50 units radius)

### Performance Considerations

- **Particle Budget**: Max 1000 particles per access point
- **Mesh Instancing**: Not currently implemented (acceptable for <20 APs)
- **Update Throttling**: Visualization updates only on new snapshots (~2-3 Hz)
- **Smooth Transitions**: Lerp for scaling, color transitions over 0.3s
- **Disposal**: Old meshes and particle systems properly disposed when APs expire

## Local State Management

All state is in-memory:

- `SignalAggregator` maintains a `ConcurrentDictionary<string, WiFiAccessPoint>` by BSSID
- Access points expire after 30 seconds of no updates
- Blazor component holds UI state (`_accessPoints`, `_networkCount`, etc.)
- No persistence layer in v1

## Extension Points for Future Versions

### Historical Recording
- Add `ISignalRepository` interface
- Implement SQLite or Realm storage
- Record snapshots with timestamp + location

### Replay Mode
- Load historical data from repository
- Timeline scrubber UI
- Animated playback

### Better Signal Field Estimation
- Implement trilateration with multiple measurements
- Use compass heading for directional heatmap
- Probabilistic position estimation

### Geospatial Mode
- Integrate with device GPS
- Map access points to geographic coordinates
- Export as GeoJSON

### Backend Sync (Optional)
- Add `ICloudSyncService` interface
- Upload snapshots to Azure, AWS, or custom backend
- Collaborative heatmap from multiple users

### AR Overlay Mode
- Use platform ARKit (iOS) / ARCore (Android)
- Overlay signal visualization on camera feed
- Real-world anchoring

## Code Quality Notes

- **Strongly Typed**: All models use `required` properties and nullable reference types
- **Events**: Standard .NET event pattern for loose coupling
- **Async/Await**: All I/O operations are async
- **Disposal**: Proper cleanup in `StopScanningAsync()` and component `Dispose()`
- **Error Handling**: Try-catch around platform APIs with console logging
- **No Global State**: All dependencies injected via constructor

## Known Limitations

1. **No Triangulation**: Access point positions are randomized, not calculated
2. **No Persistence**: Data lost on app close
3. **Scan Throttling**: Android 9+ limits scan frequency
4. **iOS Wi-Fi**: Apple restrictions prevent real Wi-Fi scanning
5. **Desktop Orientation**: Windows/macOS lack orientation sensors (mouse control instead)
6. **No Authentication**: No user accounts or cloud sync
7. **English Only**: No localization in v1

## Next Steps Priority

1. **Historical Recording** - Essential for analysis and replay
2. **Geolocation Integration** - Map signals to real coordinates
3. **Improved Signal Positioning** - Use compass heading + RSSI for rough direction
4. **Export Functionality** - JSON, CSV, or GeoJSON export
5. **AR Mode** - Immersive real-world overlay (iOS/Android only)
6. **Backend API** - Optional cloud sync and multi-user collaboration
7. **Advanced Visualization** - Heatmap mode, uncertainty cones, signal propagation animation

---

*Generated: 2026-03-08*
*Version: 1.0.0*
