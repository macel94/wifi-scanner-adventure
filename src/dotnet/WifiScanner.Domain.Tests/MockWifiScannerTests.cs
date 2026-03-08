using Xunit;
using WifiScanner.Acquisition.Providers;
using WifiScanner.Domain.Models;

namespace WifiScanner.Domain.Tests;

public class MockWifiScannerTests
{
    [Fact]
    public void MockWifiScanner_IsAvailable()
    {
        var scanner = new MockWifiScanner();
        Assert.True(scanner.IsAvailable);
        Assert.Equal("Mock Wi-Fi Scanner", scanner.ProviderName);
    }

    [Fact]
    public async Task MockWifiScanner_EmitsScanResults()
    {
        var scanner = new MockWifiScanner();
        var tcs = new TaskCompletionSource<WifiScanResult>();

        scanner.ScanCompleted += (_, result) =>
        {
            if (!tcs.Task.IsCompleted) tcs.SetResult(result);
        };

        await scanner.StartAsync(TimeSpan.FromMilliseconds(100));

        var result = await Task.WhenAny(tcs.Task, Task.Delay(5000)) == tcs.Task
            ? await tcs.Task
            : throw new TimeoutException("No scan result received within timeout");

        await scanner.StopAsync();

        Assert.NotNull(result);
        Assert.NotEmpty(result.AccessPoints);
        Assert.Equal(ProviderType.Mock, result.ProviderType);
        Assert.True(result.Timestamp > DateTimeOffset.MinValue);

        foreach (var ap in result.AccessPoints)
        {
            Assert.InRange(ap.Rssi, -100, -20);
            Assert.NotEmpty(ap.Bssid);
            Assert.True(ap.Frequency > 0);
        }
    }

    [Fact]
    public async Task MockWifiScanner_StopPreventsMoreResults()
    {
        var scanner = new MockWifiScanner();
        var resultCount = 0;

        scanner.ScanCompleted += (_, _) => Interlocked.Increment(ref resultCount);

        await scanner.StartAsync(TimeSpan.FromMilliseconds(50));
        await Task.Delay(200);
        await scanner.StopAsync();
        var countAtStop = resultCount;
        await Task.Delay(200);

        Assert.Equal(countAtStop, resultCount);
    }
}
