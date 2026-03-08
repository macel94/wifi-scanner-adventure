using WiFiScanner.Domain.Models;

namespace WiFiScanner.Domain.Interfaces;

/// <summary>
/// Interface for Wi-Fi scanning capability
/// </summary>
public interface IWiFiScanner
{
    /// <summary>
    /// Indicates if Wi-Fi scanning is supported on this platform
    /// </summary>
    bool IsSupported { get; }

    /// <summary>
    /// Indicates if scanner is currently running
    /// </summary>
    bool IsScanning { get; }

    /// <summary>
    /// Fired when new scan results are available
    /// </summary>
    event EventHandler<IReadOnlyList<WiFiScanResult>>? ScanResultsAvailable;

    /// <summary>
    /// Fired when scanning state changes
    /// </summary>
    event EventHandler<bool>? ScanningStateChanged;

    /// <summary>
    /// Request necessary permissions for Wi-Fi scanning
    /// </summary>
    Task<bool> RequestPermissionsAsync();

    /// <summary>
    /// Start continuous Wi-Fi scanning
    /// </summary>
    Task StartScanningAsync();

    /// <summary>
    /// Stop Wi-Fi scanning
    /// </summary>
    Task StopScanningAsync();

    /// <summary>
    /// Perform a single scan operation
    /// </summary>
    Task<IReadOnlyList<WiFiScanResult>> ScanOnceAsync();
}
