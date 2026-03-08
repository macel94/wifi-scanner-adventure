using Xunit;
using WifiScanner.Domain.Models;

namespace WifiScanner.Domain.Tests;

public class WifiAccessPointTests
{
    [Theory]
    [InlineData(-30, 1.0)]
    [InlineData(-100, 0.0)]
    [InlineData(-65, 0.5)]
    [InlineData(-10, 1.0)]
    [InlineData(-120, 0.0)]
    public void NormalizeRssi_ReturnsExpectedRange(int rssi, double expected)
    {
        var result = WifiAccessPoint.NormalizeRssi(rssi);
        Assert.Equal(expected, result, precision: 2);
    }

    [Theory]
    [InlineData(-40, "Excellent")]
    [InlineData(-55, "Good")]
    [InlineData(-65, "Fair")]
    [InlineData(-75, "Weak")]
    [InlineData(-90, "Very Weak")]
    public void RssiToQuality_ReturnsCorrectLabel(int rssi, string expected)
    {
        Assert.Equal(expected, WifiAccessPoint.RssiToQuality(rssi));
    }

    [Fact]
    public void WifiAccessPoint_NormalizedSignal_ComputesCorrectly()
    {
        var ap = new WifiAccessPoint
        {
            Ssid = "Test",
            Bssid = "AA:BB:CC:DD:EE:FF",
            Rssi = -65,
            Frequency = 2437,
            Channel = 6,
            Band = WifiBand.Band2_4GHz,
            Security = "WPA2",
            Timestamp = DateTimeOffset.UtcNow,
        };

        Assert.Equal(0.5, ap.NormalizedSignal, precision: 2);
    }
}
