namespace WifiScanner.Domain.Models;

public sealed record WifiScanResult
{
    public required IReadOnlyList<WifiAccessPoint> AccessPoints { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public required ProviderType ProviderType { get; init; }
    public required TimeSpan ScanDuration { get; init; }
}

public enum ProviderType
{
    Mock,
    Native,
    Bridge
}
