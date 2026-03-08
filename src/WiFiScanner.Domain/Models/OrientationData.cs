namespace WiFiScanner.Domain.Models;

/// <summary>
/// Represents device orientation and motion data
/// </summary>
public sealed class OrientationData
{
    public required double Heading { get; init; }
    public required double Pitch { get; init; }
    public required double Roll { get; init; }
    public required DateTime Timestamp { get; init; }

    /// <summary>
    /// Quaternion representation (optional, for advanced 3D)
    /// </summary>
    public Quaternion? Quaternion { get; init; }
}

public sealed class Quaternion
{
    public required double X { get; init; }
    public required double Y { get; init; }
    public required double Z { get; init; }
    public required double W { get; init; }
}
