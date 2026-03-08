namespace WifiScanner.Domain.Models;

public sealed record OrientationData
{
    public required double Alpha { get; init; }
    public required double Beta { get; init; }
    public required double Gamma { get; init; }
    public required bool Absolute { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
}
