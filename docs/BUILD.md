# Build and Run Instructions

## Prerequisites

### All Platforms
- .NET 8.0 SDK or later: https://dot.net/download
- Visual Studio 2022 17.8+ OR Visual Studio Code with C# Dev Kit

### Android
- Android SDK API 23 (Android 6.0) or higher
- Android Emulator or physical device with USB debugging enabled

### iOS
- macOS with Xcode 15+
- iOS 14.2+ device or simulator
- Apple Developer account (for physical device deployment)

### Windows
- Windows 10 version 1809+ or Windows 11
- Windows App SDK installed (included with Visual Studio)

## Quick Start

### 1. Clone and Restore

```bash
git clone <repository-url>
cd wifi-scanner-adventure
dotnet restore
```

### 2. Build

```bash
# Build all projects
dotnet build

# Or build specific target
dotnet build -f net8.0-android     # Android
dotnet build -f net8.0-ios         # iOS
dotnet build -f net8.0-windows10.0.19041.0  # Windows
```

### 3. Run

Choose your target platform:

#### Android (Emulator)

```bash
dotnet build -t:Run -f net8.0-android -p:AndroidSdkDirectory="%ANDROID_SDK_ROOT%"
```

Or in Visual Studio:
1. Set `WiFiScanner.App` as startup project
2. Select `Android Emulator` from device dropdown
3. Press F5 or click Run

#### Android (Physical Device)

1. Enable Developer Options and USB Debugging on your Android device
2. Connect device via USB
3. Run:
```bash
dotnet build -t:Run -f net8.0-android
```

Or in Visual Studio, select your device from the dropdown and press F5.

#### iOS (Simulator)

```bash
dotnet build -t:Run -f net8.0-ios
```

Or in Visual Studio for Mac:
1. Set `WiFiScanner.App` as startup project
2. Select iOS Simulator
3. Press F5 or click Run

#### iOS (Physical Device)

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device
3. In Visual Studio for Mac, select your device and press F5

⚠️ **Note**: iOS requires a paid Apple Developer account for physical device deployment.

#### Windows

```bash
dotnet build -t:Run -f net8.0-windows10.0.19041.0
```

Or in Visual Studio:
1. Set `WiFiScanner.App` as startup project
2. Select `Windows Machine` from dropdown
3. Press F5 or click Run

## Detailed Setup

### Android Permissions

The app will request location permissions at runtime. Make sure to:

1. Allow location access when prompted
2. Ensure Wi-Fi is enabled on the device
3. For best results, grant "Allow all the time" permission

If permissions are denied, the app will fall back to mock mode.

### iOS Limitations

iOS severely restricts Wi-Fi scanning. The app will automatically use mock mode on iOS. All other features (orientation, 3D visualization) work normally.

### Windows Setup

First run will request Wi-Fi adapter access:

1. A system dialog will appear requesting permission
2. Click "Yes" to allow
3. The app will discover available Wi-Fi adapters

If no Wi-Fi adapter is found, the app will use mock mode.

## Troubleshooting

### Build Errors

**"SDK not found" error**
- Ensure .NET 8.0 SDK is installed: `dotnet --version`
- Run `dotnet workload restore`

**"Android SDK not found"**
- Set ANDROID_SDK_ROOT environment variable
- Install Android SDK via Visual Studio Installer or Android Studio

**"Unable to find package Microsoft.Maui.Controls"**
- Run `dotnet restore` again
- Clear NuGet cache: `dotnet nuget locals all --clear`

### Runtime Issues

**Android: "Permissions denied"**
- Go to device Settings → Apps → WiFi Scanner 3D → Permissions
- Enable Location permission
- Ensure Wi-Fi is turned on

**Android: "No networks found" even though Wi-Fi is visible**
- Check location services are enabled system-wide
- Some Android 10+ devices require "High accuracy" location mode
- Scanning is throttled to ~4 times per minute on Android 9+

**Windows: "No Wi-Fi adapter found"**
- Ensure your PC has a Wi-Fi adapter
- Check Device Manager → Network Adapters
- Try running as Administrator

**3D visualization not appearing**
- Check browser console in debug mode
- Ensure JavaScript is enabled
- Try clearing app cache

**Orientation not updating**
- Check sensor availability on your device
- On desktop, use mouse to rotate camera instead
- Calibrate compass/sensors in device settings

## Development Tips

### Hot Reload

.NET MAUI supports hot reload for XAML and C# code:

1. Run the app in Debug mode
2. Make changes to .cs or .razor files
3. Save - changes apply automatically (most of the time)

For JavaScript/CSS changes in wwwroot, rebuild the app.

### Debugging

**Visual Studio**:
- Set breakpoints in C# code normally
- Use Debug → Windows → Output to see console logs
- Android logs appear in Debug Output (select "Debug" filter)

**VS Code**:
- Install C# Dev Kit extension
- Use F5 to start debugging
- Console.WriteLine appears in Debug Console

**JavaScript Debugging**:
- Enable Blazor WebView developer tools (already enabled in Debug)
- Right-click in the app → Inspect
- Browser DevTools will open showing JavaScript console

### Testing on Multiple Platforms

To test quickly across platforms without full rebuild:

```bash
# Build all platforms
dotnet build WiFiScanner.sln

# Then run specific platforms
dotnet run --project src/WiFiScanner.App --framework net8.0-android
dotnet run --project src/WiFiScanner.App --framework net8.0-windows10.0.19041.0
```

## Publishing

### Android APK

```bash
cd src/WiFiScanner.App
dotnet publish -f net8.0-android -c Release -p:AndroidPackageFormat=apk
```

Output: `bin/Release/net8.0-android/publish/*.apk`

### Android AAB (Google Play)

```bash
dotnet publish -f net8.0-android -c Release -p:AndroidPackageFormat=aab
```

Output: `bin/Release/net8.0-android/publish/*.aab`

### iOS IPA

```bash
dotnet publish -f net8.0-ios -c Release -p:ArchiveOnBuild=true
```

Output: `bin/Release/net8.0-ios/publish/*.ipa`

### Windows MSIX

```bash
dotnet publish -f net8.0-windows10.0.19041.0 -c Release -p:RuntimeIdentifierOverride=win10-x64
```

Output: `bin/Release/net8.0-windows10.0.19041.0/win10-x64/AppPackages/`

## Performance Tips

### Android
- Use a physical device for best performance
- Release builds are significantly faster than Debug
- Emulators with hardware acceleration (HAXM/WHPX) perform better

### iOS
- Simulator performance is generally good for testing
- Physical devices provide smoother 3D rendering

### Windows
- Desktop performance is excellent
- No special optimization needed

## CI/CD Setup (GitHub Actions Example)

```yaml
name: Build MAUI App

on: [push, pull_request]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Install MAUI workload
        run: dotnet workload install maui
      - name: Build Android
        run: dotnet build src/WiFiScanner.App/WiFiScanner.App.csproj -f net8.0-android

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Install MAUI workload
        run: dotnet workload install maui
      - name: Build Windows
        run: dotnet build src/WiFiScanner.App/WiFiScanner.App.csproj -f net8.0-windows10.0.19041.0

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - name: Install MAUI workload
        run: dotnet workload install maui
      - name: Build iOS
        run: dotnet build src/WiFiScanner.App/WiFiScanner.App.csproj -f net8.0-ios
```

## Additional Resources

- [.NET MAUI Documentation](https://learn.microsoft.com/dotnet/maui/)
- [Blazor Hybrid](https://learn.microsoft.com/aspnet/core/blazor/hybrid/)
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Android Wi-Fi Scanning](https://developer.android.com/guide/topics/connectivity/wifi-scan)
- [Windows Wi-Fi API](https://learn.microsoft.com/windows/uwp/devices-sensors/wifi-and-bluetooth)

---

*Last Updated: 2026-03-08*
