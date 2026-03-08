using WifiScanner.Domain.Interfaces;
using WifiScanner.Domain.Models;

namespace WifiScanner.Acquisition.Providers;

/// <summary>
/// Placeholder for Android Wi-Fi scanning via WifiManager.
/// This requires MAUI workloads and Android target framework to compile.
/// In v1, this serves as the documented integration point.
/// </summary>
public sealed class AndroidWifiScanner : IWifiScanner
{
    public string ProviderName => "Android Wi-Fi Scanner";
    public bool IsAvailable => false; // Will be true on Android with proper permissions

    public event EventHandler<WifiScanResult>? ScanCompleted;
    public event EventHandler<Exception>? ScanFailed;

    public Task StartAsync(TimeSpan scanInterval, CancellationToken ct = default)
    {
        // On Android, this would:
        // 1. Check ACCESS_FINE_LOCATION permission
        // 2. Register BroadcastReceiver for SCAN_RESULTS_AVAILABLE_ACTION
        // 3. Call WifiManager.StartScan()
        // 4. Process results in the receiver callback
        throw new PlatformNotSupportedException(
            "Android Wi-Fi scanning requires MAUI Android target. Use MockWifiScanner for development."
        );
    }

    public Task StopAsync(CancellationToken ct = default)
    {
        // Unregister BroadcastReceiver
        return Task.CompletedTask;
    }
}
