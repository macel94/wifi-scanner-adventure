using WiFiScanner.Domain.Interfaces;
using WiFiScanner.Domain.Models;

namespace WiFiScanner.App.Services;

/// <summary>
/// MAUI cross-platform orientation provider using built-in sensors
/// </summary>
public sealed class MauiOrientationProvider : IOrientationProvider
{
    private bool _isTracking;

    public bool IsSupported => Compass.Default.IsSupported || Gyroscope.Default.IsSupported;
    public bool IsTracking => _isTracking;
    public OrientationData? CurrentOrientation { get; private set; }

    public event EventHandler<OrientationData>? OrientationChanged;

    public Task StartTrackingAsync()
    {
        if (_isTracking) return Task.CompletedTask;

        try
        {
            if (Compass.Default.IsSupported)
            {
                Compass.Default.ReadingChanged += OnCompassReadingChanged;
                Compass.Default.Start(SensorSpeed.UI);
            }

            if (Gyroscope.Default.IsSupported)
            {
                Gyroscope.Default.ReadingChanged += OnGyroscopeReadingChanged;
                Gyroscope.Default.Start(SensorSpeed.UI);
            }

            _isTracking = true;
        }
        catch
        {
            // Sensor initialization failed
        }

        return Task.CompletedTask;
    }

    public Task StopTrackingAsync()
    {
        if (!_isTracking) return Task.CompletedTask;

        try
        {
            if (Compass.Default.IsSupported)
            {
                Compass.Default.ReadingChanged -= OnCompassReadingChanged;
                Compass.Default.Stop();
            }

            if (Gyroscope.Default.IsSupported)
            {
                Gyroscope.Default.ReadingChanged -= OnGyroscopeReadingChanged;
                Gyroscope.Default.Stop();
            }

            _isTracking = false;
        }
        catch
        {
            // Sensor cleanup failed
        }

        return Task.CompletedTask;
    }

    private void OnCompassReadingChanged(object? sender, CompassChangedEventArgs e)
    {
        var reading = e.Reading;
        var orientation = new OrientationData
        {
            Heading = reading.HeadingMagneticNorth,
            Pitch = 0,
            Roll = 0,
            Timestamp = DateTime.UtcNow
        };

        CurrentOrientation = orientation;
        OrientationChanged?.Invoke(this, orientation);
    }

    private void OnGyroscopeReadingChanged(object? sender, GyroscopeChangedEventArgs e)
    {
        // Gyroscope provides angular velocity, not absolute orientation
        // For a complete solution, combine with accelerometer and magnetometer
        // This is simplified for the prototype
    }
}
