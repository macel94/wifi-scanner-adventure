namespace WifiScanner.Domain.Models;

public sealed record SignalSnapshot
{
    public required IReadOnlyDictionary<string, WifiAccessPoint> AccessPoints { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public int Count => AccessPoints.Count;
}
