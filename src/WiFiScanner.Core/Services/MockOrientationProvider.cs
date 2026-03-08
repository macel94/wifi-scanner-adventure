using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.Core.Services;

/// <summary>
/// Mock orientation provider for testing and unsupported platforms
/// </summary>
public sealed class MockOrientationProvider : IOrientationProvider
{
    private Timer? _updateTimer;
    private double _currentHeading;
    private readonly Random _random = new();

    public bool IsSupported => true;
    public bool IsTracking { get; private set; }
    public OrientationData? CurrentOrientation { get; private set; }

    public event EventHandler<OrientationData>? OrientationChanged;

    public Task StartTrackingAsync()
    {
        if (IsTracking) return Task.CompletedTask;

        IsTracking = true;
        _currentHeading = 0;

        _updateTimer = new Timer(_ => UpdateOrientation(), null, TimeSpan.Zero, TimeSpan.FromMilliseconds(50));

        return Task.CompletedTask;
    }

    public Task StopTrackingAsync()
    {
        if (!IsTracking) return Task.CompletedTask;

        _updateTimer?.Dispose();
        _updateTimer = null;
        IsTracking = false;

        return Task.CompletedTask;
    }

    private void UpdateOrientation()
    {
        // Simulate slow rotation
        _currentHeading += _random.NextDouble() * 2 - 1;
        if (_currentHeading < 0) _currentHeading += 360;
        if (_currentHeading >= 360) _currentHeading -= 360;

        var pitch = Math.Sin(_currentHeading * Math.PI / 180) * 10;
        var roll = Math.Cos(_currentHeading * Math.PI / 180) * 5;

        var orientation = new OrientationData
        {
            Heading = _currentHeading,
            Pitch = pitch,
            Roll = roll,
            Timestamp = DateTime.UtcNow
        };

        CurrentOrientation = orientation;
        OrientationChanged?.Invoke(this, orientation);
    }
}
