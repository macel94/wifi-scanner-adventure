namespace WifiScanner.Domain.Models;

public sealed record WifiAccessPoint
{
    public required string Ssid { get; init; }
    public required string Bssid { get; init; }
    public required int Rssi { get; init; }
    public required int Frequency { get; init; }
    public required int Channel { get; init; }
    public required WifiBand Band { get; init; }
    public required string Security { get; init; }
    public required DateTimeOffset Timestamp { get; init; }

    public double NormalizedSignal => NormalizeRssi(Rssi);

    public static double NormalizeRssi(int rssi)
    {
        const int minRssi = -100;
        const int maxRssi = -30;
        return Math.Clamp((double)(rssi - minRssi) / (maxRssi - minRssi), 0.0, 1.0);
    }

    public static string RssiToQuality(int rssi) => rssi switch
    {
        >= -50 => "Excellent",
        >= -60 => "Good",
        >= -70 => "Fair",
        >= -80 => "Weak",
        _ => "Very Weak"
    };
}

public enum WifiBand
{
    Band2_4GHz,
    Band5GHz,
    Band6GHz,
    Unknown
}
