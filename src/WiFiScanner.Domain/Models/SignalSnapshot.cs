namespace WiFiScanner.Domain.Models;

/// <summary>
/// Snapshot of all Wi-Fi signals at a point in time
/// </summary>
public sealed class SignalSnapshot
{
    public required DateTime Timestamp { get; init; }
    public required IReadOnlyList<WiFiAccessPoint> AccessPoints { get; init; }
    public required int TotalCount { get; init; }
    public OrientationData? Orientation { get; init; }
}
