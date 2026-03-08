namespace WiFiScanner.Domain.Models;

/// <summary>
/// Represents a single Wi-Fi scan result at a point in time
/// </summary>
public sealed class WiFiScanResult
{
    public required string Ssid { get; init; }
    public required string Bssid { get; init; }
    public required int RssiDbm { get; init; }
    public required DateTime Timestamp { get; init; }
    public int? FrequencyMhz { get; init; }
    public int? Channel { get; init; }
    public string? SecurityType { get; init; }

    /// <summary>
    /// Normalized signal strength (0.0 to 1.0)
    /// </summary>
    public double SignalStrength => NormalizeRssi(RssiDbm);

    private static double NormalizeRssi(int rssi)
    {
        // RSSI typically ranges from -100 (worst) to -30 (best)
        const int minRssi = -100;
        const int maxRssi = -30;

        var clamped = Math.Clamp(rssi, minRssi, maxRssi);
        return (clamped - minRssi) / (double)(maxRssi - minRssi);
    }
}
