using WifiScanner.Domain.Interfaces;
using WifiScanner.Domain.Models;

namespace WifiScanner.Acquisition.Providers;

public sealed class MockWifiScanner : IWifiScanner
{
    private static readonly (string Ssid, string Bssid, int BaseRssi, int Frequency, string Security)[] Networks =
    [
        ("HomeNetwork-5G", "AA:BB:CC:DD:EE:01", -35, 5180, "WPA3"),
        ("HomeNetwork", "AA:BB:CC:DD:EE:02", -42, 2437, "WPA2"),
        ("Neighbor_WiFi", "11:22:33:44:55:01", -58, 2462, "WPA2"),
        ("CoffeeShop_Free", "11:22:33:44:55:02", -65, 2412, "Open"),
        ("Office-5GHz", "AA:CC:DD:EE:FF:01", -48, 5240, "WPA2-Enterprise"),
        ("IoT-Sensors", "AA:CC:DD:EE:FF:02", -72, 2422, "WPA2"),
        ("Guest-Network", "BB:CC:DD:EE:FF:03", -55, 5745, "WPA2"),
        ("SmartHome-Hub", "CC:DD:EE:FF:00:04", -61, 2447, "WPA3"),
        ("DIRECT-printer", "EE:FF:00:11:22:06", -82, 2417, "WPA2"),
        ("Mesh-Node-2", "FF:00:11:22:33:07", -44, 5200, "WPA3"),
    ];

    private readonly Random _random = new();
    private CancellationTokenSource? _cts;

    public string ProviderName => "Mock Wi-Fi Scanner";
    public bool IsAvailable => true;

    public event EventHandler<WifiScanResult>? ScanCompleted;
    public event EventHandler<Exception>? ScanFailed;

    public Task StartAsync(TimeSpan scanInterval, CancellationToken ct = default)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        _ = ScanLoopAsync(scanInterval, _cts.Token);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken ct = default)
    {
        _cts?.Cancel();
        _cts?.Dispose();
        _cts = null;
        return Task.CompletedTask;
    }

    private async Task ScanLoopAsync(TimeSpan interval, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var start = DateTimeOffset.UtcNow;
                var accessPoints = GenerateScanResults();
                var duration = DateTimeOffset.UtcNow - start;

                var result = new WifiScanResult
                {
                    AccessPoints = accessPoints,
                    Timestamp = DateTimeOffset.UtcNow,
                    ProviderType = ProviderType.Mock,
                    ScanDuration = duration + TimeSpan.FromMilliseconds(_random.Next(50, 200)),
                };

                ScanCompleted?.Invoke(this, result);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                ScanFailed?.Invoke(this, ex);
            }

            await Task.Delay(interval, ct);
        }
    }

    private List<WifiAccessPoint> GenerateScanResults()
    {
        return Networks
            .Where(_ => _random.NextDouble() > 0.15)
            .Select(n =>
            {
                var rssiJitter = (_random.NextDouble() - 0.5) * 12;
                var rssi = (int)Math.Clamp(n.BaseRssi + rssiJitter, -100, -20);
                return new WifiAccessPoint
                {
                    Ssid = n.Ssid,
                    Bssid = n.Bssid,
                    Rssi = rssi,
                    Frequency = n.Frequency,
                    Channel = FrequencyToChannel(n.Frequency),
                    Band = FrequencyToBand(n.Frequency),
                    Security = n.Security,
                    Timestamp = DateTimeOffset.UtcNow,
                };
            })
            .ToList();
    }

    private static WifiBand FrequencyToBand(int frequencyMhz) => frequencyMhz switch
    {
        >= 2400 and <= 2500 => WifiBand.Band2_4GHz,
        >= 5150 and <= 5875 => WifiBand.Band5GHz,
        >= 5925 and <= 7125 => WifiBand.Band6GHz,
        _ => WifiBand.Unknown,
    };

    private static int FrequencyToChannel(int frequencyMhz) => frequencyMhz switch
    {
        2484 => 14,
        >= 2412 and <= 2472 => (frequencyMhz - 2407) / 5,
        >= 5170 and <= 5825 => (frequencyMhz - 5000) / 5,
        _ => 0,
    };
}
