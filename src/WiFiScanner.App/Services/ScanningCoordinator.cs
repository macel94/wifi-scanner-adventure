using WiFiScanner.Core.Services;
using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.App.Services;

/// <summary>
/// Coordinates scanning and aggregation
/// </summary>
public sealed class ScanningCoordinator
{
    private readonly IWiFiScanner _scanner;
    private readonly IOrientationProvider _orientationProvider;
    private readonly SignalAggregator _aggregator;

    public bool IsScanning => _scanner.IsScanning;
    public bool IsOrientationTracking => _orientationProvider.IsTracking;

    public event EventHandler<SignalSnapshot>? SnapshotUpdated;
    public event EventHandler<OrientationData>? OrientationChanged;

    public ScanningCoordinator(
        IWiFiScanner scanner,
        IOrientationProvider orientationProvider,
        SignalAggregator aggregator)
    {
        _scanner = scanner;
        _orientationProvider = orientationProvider;
        _aggregator = aggregator;

        _scanner.ScanResultsAvailable += OnScanResultsAvailable;
        _aggregator.SnapshotUpdated += OnSnapshotUpdated;
        _orientationProvider.OrientationChanged += OnOrientationChanged;
    }

    public async Task<bool> InitializeAsync()
    {
        var permissionsGranted = await _scanner.RequestPermissionsAsync();
        return permissionsGranted;
    }

    public async Task StartAsync()
    {
        await _scanner.StartScanningAsync();
        await _orientationProvider.StartTrackingAsync();
    }

    public async Task StopAsync()
    {
        await _scanner.StopScanningAsync();
        await _orientationProvider.StopTrackingAsync();
    }

    private void OnScanResultsAvailable(object? sender, IReadOnlyList<WiFiScanResult> results)
    {
        _aggregator.ProcessScanResults(results);
    }

    private void OnSnapshotUpdated(object? sender, SignalSnapshot snapshot)
    {
        var snapshotWithOrientation = new SignalSnapshot
        {
            Timestamp = snapshot.Timestamp,
            AccessPoints = snapshot.AccessPoints,
            TotalCount = snapshot.TotalCount,
            Orientation = _orientationProvider.CurrentOrientation
        };

        SnapshotUpdated?.Invoke(this, snapshotWithOrientation);
    }

    private void OnOrientationChanged(object? sender, OrientationData orientation)
    {
        OrientationChanged?.Invoke(this, orientation);
    }
}
