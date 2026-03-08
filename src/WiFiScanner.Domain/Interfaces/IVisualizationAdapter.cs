using WiFiScanner.Domain.Models;

namespace WiFiScanner.Domain.Interfaces;

/// <summary>
/// Interface for visualization engine adapter
/// </summary>
public interface IVisualizationAdapter
{
    /// <summary>
    /// Initialize the visualization engine
    /// </summary>
    Task InitializeAsync();

    /// <summary>
    /// Update the scene with new signal data
    /// </summary>
    void UpdateSignals(SignalSnapshot snapshot);

    /// <summary>
    /// Update camera orientation
    /// </summary>
    void UpdateOrientation(OrientationData orientation);

    /// <summary>
    /// Dispose resources
    /// </summary>
    void Dispose();
}
