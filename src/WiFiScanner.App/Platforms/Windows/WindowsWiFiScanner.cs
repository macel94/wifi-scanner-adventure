using Windows.Devices.WiFi;
using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.App.Platforms.Windows;

/// <summary>
/// Windows-specific Wi-Fi scanner implementation
/// </summary>
public sealed class WindowsWiFiScanner : IWiFiScanner
{
    private WiFiAdapter? _wifiAdapter;
    private Timer? _scanTimer;

    public bool IsSupported => true;
    public bool IsScanning { get; private set; }

    public event EventHandler<IReadOnlyList<WiFiScanResult>>? ScanResultsAvailable;
    public event EventHandler<bool>? ScanningStateChanged;

    public async Task<bool> RequestPermissionsAsync()
    {
        try
        {
            var accessStatus = await WiFiAdapter.RequestAccessAsync();
            if (accessStatus != WiFiAccessStatus.Allowed)
                return false;

            var adapters = await WiFiAdapter.FindAllAdaptersAsync();
            _wifiAdapter = adapters.FirstOrDefault();

            return _wifiAdapter != null;
        }
        catch
        {
            return false;
        }
    }

    public Task StartScanningAsync()
    {
        if (IsScanning || _wifiAdapter == null)
            return Task.CompletedTask;

        IsScanning = true;
        ScanningStateChanged?.Invoke(this, true);

        _scanTimer = new Timer(async _ => await PerformScanAsync(), null, TimeSpan.Zero, TimeSpan.FromSeconds(3));

        return Task.CompletedTask;
    }

    public Task StopScanningAsync()
    {
        if (!IsScanning)
            return Task.CompletedTask;

        _scanTimer?.Dispose();
        _scanTimer = null;
        IsScanning = false;
        ScanningStateChanged?.Invoke(this, false);

        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<WiFiScanResult>> ScanOnceAsync()
    {
        if (_wifiAdapter == null)
            return Array.Empty<WiFiScanResult>();

        await _wifiAdapter.ScanAsync();
        return GetScanResults();
    }

    private async Task PerformScanAsync()
    {
        if (_wifiAdapter == null) return;

        try
        {
            await _wifiAdapter.ScanAsync();
            var results = GetScanResults();
            ScanResultsAvailable?.Invoke(this, results);
        }
        catch
        {
            // Scan failed, continue
        }
    }

    private List<WiFiScanResult> GetScanResults()
    {
        if (_wifiAdapter == null)
            return new List<WiFiScanResult>();

        var results = new List<WiFiScanResult>();
        var report = _wifiAdapter.NetworkReport;

        foreach (var network in report.AvailableNetworks)
        {
            results.Add(new WiFiScanResult
            {
                Ssid = network.Ssid,
                Bssid = network.Bssid ?? "Unknown",
                RssiDbm = network.NetworkRssiInDecibelMilliwatts,
                Timestamp = DateTime.UtcNow,
                FrequencyMhz = (int)(network.ChannelCenterFrequencyInKilohertz / 1000),
                Channel = null,
                SecurityType = network.SecuritySettings.NetworkAuthenticationType.ToString()
            });
        }

        return results;
    }
}
