using WiFiScanner.Domain.Models;

namespace WiFiScanner.Domain.Interfaces;

/// <summary>
/// Interface for device orientation and sensor access
/// </summary>
public interface IOrientationProvider
{
    /// <summary>
    /// Indicates if orientation tracking is supported
    /// </summary>
    bool IsSupported { get; }

    /// <summary>
    /// Indicates if orientation tracking is active
    /// </summary>
    bool IsTracking { get; }

    /// <summary>
    /// Current orientation data
    /// </summary>
    OrientationData? CurrentOrientation { get; }

    /// <summary>
    /// Fired when orientation changes
    /// </summary>
    event EventHandler<OrientationData>? OrientationChanged;

    /// <summary>
    /// Start tracking orientation
    /// </summary>
    Task StartTrackingAsync();

    /// <summary>
    /// Stop tracking orientation
    /// </summary>
    Task StopTrackingAsync();
}
