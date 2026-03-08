using System.Collections.Concurrent;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.Core.Services;

/// <summary>
/// Aggregates and manages Wi-Fi access point data over time
/// </summary>
public sealed class SignalAggregator
{
    private readonly ConcurrentDictionary<string, WiFiAccessPoint> _accessPoints = new();
    private readonly TimeSpan _expirationTime = TimeSpan.FromSeconds(30);

    public event EventHandler<SignalSnapshot>? SnapshotUpdated;

    public void ProcessScanResults(IReadOnlyList<WiFiScanResult> results)
    {
        var now = DateTime.UtcNow;

        foreach (var result in results)
        {
            if (_accessPoints.TryGetValue(result.Bssid, out var ap))
            {
                ap.UpdateSignal(result);
            }
            else
            {
                var newAp = new WiFiAccessPoint
                {
                    Bssid = result.Bssid,
                    Ssid = result.Ssid,
                    CurrentRssi = result.RssiDbm,
                    SignalStrength = result.SignalStrength,
                    LastSeen = result.Timestamp,
                    FirstSeen = result.Timestamp,
                    FrequencyMhz = result.FrequencyMhz,
                    Channel = result.Channel,
                    SecurityType = result.SecurityType
                };
                newAp.UpdateSignal(result);
                _accessPoints[result.Bssid] = newAp;
            }
        }

        // Remove expired access points
        var expired = _accessPoints
            .Where(kvp => now - kvp.Value.LastSeen > _expirationTime)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var bssid in expired)
        {
            _accessPoints.TryRemove(bssid, out _);
        }

        EmitSnapshot();
    }

    public SignalSnapshot GetCurrentSnapshot()
    {
        var aps = _accessPoints.Values.OrderByDescending(ap => ap.SignalStrength).ToList();

        return new SignalSnapshot
        {
            Timestamp = DateTime.UtcNow,
            AccessPoints = aps,
            TotalCount = aps.Count
        };
    }

    private void EmitSnapshot()
    {
        var snapshot = GetCurrentSnapshot();
        SnapshotUpdated?.Invoke(this, snapshot);
    }

    public void Clear()
    {
        _accessPoints.Clear();
    }
}
