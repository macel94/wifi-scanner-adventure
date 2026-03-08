# Platform Support Matrix

## Wi-Fi Scanning

| Platform | Wi-Fi Scanning | Implementation | Caveats |
|----------|---------------|----------------|---------|
| **Android** | ✅ Real | `WifiManager.startScan()` | Requires `ACCESS_FINE_LOCATION` + `CHANGE_WIFI_STATE`. Throttled to 4 scans per 2 minutes since Android 9. Background scanning requires `ACCESS_BACKGROUND_LOCATION`. |
| **iOS** | ⚠️ Limited | `NEHotspotHelper` | Requires special Apple entitlement. Cannot freely scan — only triggered during network selection. v1 uses mock provider. |
| **Windows** | ✅ Real | `Windows.Devices.WiFi.WiFiAdapter` | Requires WiFi capability declaration. Works well for scanning. |
| **macOS** | ✅ Real | `CoreWLAN.CWWiFiClient` | Native API available. Requires location permission on newer macOS versions. |
| **Web (Browser)** | ❌ Mock only | Mock provider | No browser API for Wi-Fi scanning. Mock provider simulates realistic data. |

## Orientation / Sensors

| Platform | Orientation Sensors | Implementation | Caveats |
|----------|-------------------|----------------|---------|
| **Android** | ✅ Real | DeviceOrientation API (WebView) / MAUI Sensors | Works in WebView with proper permissions. |
| **iOS** | ✅ Real | DeviceOrientation API (WebView) / MAUI Sensors | Requires user gesture to enable DeviceOrientation in Safari/WebView. |
| **Windows** | ⚠️ Mouse fallback | Mouse-based camera control | Most Windows devices lack gyroscope. Mouse orbit provides equivalent UX. |
| **macOS** | ⚠️ Mouse fallback | Mouse-based camera control | Same as Windows — mouse control for desktop. |
| **Web (Browser)** | ✅/⚠️ | DeviceOrientation API | Works on mobile browsers. Falls back to mouse on desktop. |

## 3D Rendering

| Platform | 3D Rendering | Implementation | Caveats |
|----------|-------------|----------------|---------|
| **Android** | ✅ | Three.js in WebView | WebGL supported in Android WebView (Chromium-based). |
| **iOS** | ✅ | Three.js in WebView | WebGL supported in WKWebView. |
| **Windows** | ✅ | Three.js in WebView2 / Browser | Full WebGL 2.0 support. |
| **macOS** | ✅ | Three.js in WKWebView / Browser | Full WebGL support. |
| **Web (Browser)** | ✅ | Three.js standalone | Best performance — direct browser access. |

## v1 Implementation Status

| Platform | Wi-Fi Data | Orientation | Rendering | Status |
|----------|-----------|-------------|-----------|--------|
| **Web (any browser)** | Mock | Real (mobile) / Mouse (desktop) | Real | ✅ Fully functional |
| **Android (MAUI)** | Real (native bridge) | Real | Real (WebView) | 🔧 Shell ready, bridge defined |
| **iOS (MAUI)** | Mock | Real | Real (WebView) | 🔧 Shell ready |
| **Windows (MAUI)** | Real (native bridge) | Mouse | Real (WebView2) | 🔧 Shell ready |
