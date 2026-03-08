using Android.Content;
using Android.Net.Wifi;
using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;
using AndroidX.Core.Content;
using Android.Content.PM;

namespace WiFiScanner.App.Platforms.Android;

/// <summary>
/// Android-specific Wi-Fi scanner implementation
/// </summary>
public sealed class AndroidWiFiScanner : IWiFiScanner
{
    private readonly WifiManager? _wifiManager;
    private readonly Context? _context;
    private Timer? _scanTimer;
    private WifiScanReceiver? _scanReceiver;

    public bool IsSupported => _wifiManager != null;
    public bool IsScanning { get; private set; }

    public event EventHandler<IReadOnlyList<WiFiScanResult>>? ScanResultsAvailable;
    public event EventHandler<bool>? ScanningStateChanged;

    public AndroidWiFiScanner()
    {
        _context = global::Android.App.Application.Context;
        _wifiManager = _context?.GetSystemService(Context.WifiService) as WifiManager;
    }

    public async Task<bool> RequestPermissionsAsync()
    {
        if (_context == null) return false;

        var status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
        if (status != PermissionStatus.Granted)
            return false;

        // Android 10+ requires fine location
        if (global::Android.OS.Build.VERSION.SdkInt >= global::Android.OS.BuildVersionCodes.Q)
        {
            var fineStatus = ContextCompat.CheckSelfPermission(_context, global::Android.Manifest.Permission.AccessFineLocation);
            if (fineStatus != Permission.Granted)
                return false;
        }

        return true;
    }

    public Task StartScanningAsync()
    {
        if (IsScanning || _wifiManager == null || _context == null)
            return Task.CompletedTask;

        IsScanning = true;
        ScanningStateChanged?.Invoke(this, true);

        _scanReceiver = new WifiScanReceiver(this);
        _context.RegisterReceiver(_scanReceiver, new IntentFilter(WifiManager.ScanResultsAvailableAction));

        _scanTimer = new Timer(_ =>
        {
            _wifiManager?.StartScan();
        }, null, TimeSpan.Zero, TimeSpan.FromSeconds(3));

        return Task.CompletedTask;
    }

    public Task StopScanningAsync()
    {
        if (!IsScanning || _context == null)
            return Task.CompletedTask;

        _scanTimer?.Dispose();
        _scanTimer = null;

        if (_scanReceiver != null)
        {
            _context.UnregisterReceiver(_scanReceiver);
            _scanReceiver = null;
        }

        IsScanning = false;
        ScanningStateChanged?.Invoke(this, false);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<WiFiScanResult>> ScanOnceAsync()
    {
        if (_wifiManager == null)
            return Task.FromResult<IReadOnlyList<WiFiScanResult>>(Array.Empty<WiFiScanResult>());

        _wifiManager.StartScan();
        var results = GetScanResults();
        return Task.FromResult<IReadOnlyList<WiFiScanResult>>(results);
    }

    internal void OnScanResultsAvailable()
    {
        var results = GetScanResults();
        ScanResultsAvailable?.Invoke(this, results);
    }

    private List<WiFiScanResult> GetScanResults()
    {
        if (_wifiManager == null)
            return new List<WiFiScanResult>();

        var scanResults = _wifiManager.ScanResults;
        if (scanResults == null)
            return new List<WiFiScanResult>();

        var results = new List<WiFiScanResult>();
        foreach (var sr in scanResults)
        {
            if (sr == null) continue;

            results.Add(new WiFiScanResult
            {
                Ssid = sr.Ssid ?? "Unknown",
                Bssid = sr.Bssid ?? "00:00:00:00:00:00",
                RssiDbm = sr.Level,
                Timestamp = DateTime.UtcNow,
                FrequencyMhz = sr.Frequency,
                Channel = FrequencyToChannel(sr.Frequency),
                SecurityType = sr.Capabilities ?? "Unknown"
            });
        }

        return results;
    }

    private static int? FrequencyToChannel(int frequencyMhz)
    {
        if (frequencyMhz >= 2412 && frequencyMhz <= 2484)
        {
            if (frequencyMhz == 2484)
                return 14;
            return (frequencyMhz - 2412) / 5 + 1;
        }
        else if (frequencyMhz >= 5170 && frequencyMhz <= 5825)
        {
            return (frequencyMhz - 5170) / 5 + 34;
        }
        return null;
    }

    private class WifiScanReceiver : BroadcastReceiver
    {
        private readonly AndroidWiFiScanner _scanner;

        public WifiScanReceiver(AndroidWiFiScanner scanner)
        {
            _scanner = scanner;
        }

        public override void OnReceive(Context? context, Intent? intent)
        {
            if (intent?.Action == WifiManager.ScanResultsAvailableAction)
            {
                _scanner.OnScanResultsAvailable();
            }
        }
    }
}
