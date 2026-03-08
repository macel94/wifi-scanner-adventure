namespace WiFiScanner.Domain.Models;

/// <summary>
/// Represents an access point with aggregated signal data over time
/// </summary>
public sealed class WiFiAccessPoint
{
    public required string Bssid { get; init; }
    public required string Ssid { get; init; }
    public required int CurrentRssi { get; set; }
    public required double SignalStrength { get; set; }
    public required DateTime LastSeen { get; set; }
    public required DateTime FirstSeen { get; init; }
    public int? FrequencyMhz { get; init; }
    public int? Channel { get; init; }
    public string? SecurityType { get; init; }

    /// <summary>
    /// History of RSSI measurements for smoothing
    /// </summary>
    public List<int> RssiHistory { get; } = new();

    /// <summary>
    /// Maximum history size for smoothing
    /// </summary>
    public const int MaxHistorySize = 10;

    public void UpdateSignal(WiFiScanResult result)
    {
        CurrentRssi = result.RssiDbm;
        SignalStrength = result.SignalStrength;
        LastSeen = result.Timestamp;

        RssiHistory.Add(result.RssiDbm);
        if (RssiHistory.Count > MaxHistorySize)
        {
            RssiHistory.RemoveAt(0);
        }
    }

    public double GetSmoothedSignalStrength()
    {
        if (RssiHistory.Count == 0)
            return SignalStrength;

        var avgRssi = RssiHistory.Average();
        const int minRssi = -100;
        const int maxRssi = -30;
        var clamped = Math.Clamp(avgRssi, minRssi, maxRssi);
        return (clamped - minRssi) / (maxRssi - minRssi);
    }
}
