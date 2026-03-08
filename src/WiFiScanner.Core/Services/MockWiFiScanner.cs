using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.Core.Services;

/// <summary>
/// Mock Wi-Fi scanner for testing and unsupported platforms
/// </summary>
public sealed class MockWiFiScanner : IWiFiScanner
{
    private readonly Random _random = new();
    private Timer? _scanTimer;
    private readonly List<string> _mockSsids = new()
    {
        "HomeNetwork_5G", "OfficeWiFi", "CoffeeShop_Guest",
        "Neighbor_2.4G", "PublicLibrary", "SmartHome_IoT",
        "CorpSecure", "MobileHotspot", "GuestNetwork"
    };

    public bool IsSupported => true;
    public bool IsScanning { get; private set; }

    public event EventHandler<IReadOnlyList<WiFiScanResult>>? ScanResultsAvailable;
    public event EventHandler<bool>? ScanningStateChanged;

    public Task<bool> RequestPermissionsAsync()
    {
        return Task.FromResult(true);
    }

    public Task StartScanningAsync()
    {
        if (IsScanning) return Task.CompletedTask;

        IsScanning = true;
        ScanningStateChanged?.Invoke(this, true);

        _scanTimer = new Timer(_ => PerformMockScan(), null, TimeSpan.Zero, TimeSpan.FromSeconds(2));

        return Task.CompletedTask;
    }

    public Task StopScanningAsync()
    {
        if (!IsScanning) return Task.CompletedTask;

        _scanTimer?.Dispose();
        _scanTimer = null;
        IsScanning = false;
        ScanningStateChanged?.Invoke(this, false);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<WiFiScanResult>> ScanOnceAsync()
    {
        var results = GenerateMockResults();
        return Task.FromResult<IReadOnlyList<WiFiScanResult>>(results);
    }

    private void PerformMockScan()
    {
        var results = GenerateMockResults();
        ScanResultsAvailable?.Invoke(this, results);
    }

    private List<WiFiScanResult> GenerateMockResults()
    {
        var results = new List<WiFiScanResult>();
        var networkCount = _random.Next(3, 8);

        for (int i = 0; i < networkCount; i++)
        {
            var ssid = _mockSsids[_random.Next(_mockSsids.Count)];
            var rssi = _random.Next(-90, -40);
            var frequency = _random.Next(2) == 0 ? 2437 : 5180;
            var channel = frequency < 3000 ? _random.Next(1, 12) : _random.Next(36, 165);

            results.Add(new WiFiScanResult
            {
                Ssid = ssid,
                Bssid = GenerateMockBssid(),
                RssiDbm = rssi,
                Timestamp = DateTime.UtcNow,
                FrequencyMhz = frequency,
                Channel = channel,
                SecurityType = "WPA2"
            });
        }

        return results;
    }

    private string GenerateMockBssid()
    {
        var bytes = new byte[6];
        _random.NextBytes(bytes);
        return string.Join(":", bytes.Select(b => b.ToString("X2")));
    }
}
