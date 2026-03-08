using WifiScanner.Domain.Models;

namespace WifiScanner.Domain.Interfaces;

public interface IWifiScanner
{
    string ProviderName { get; }
    bool IsAvailable { get; }
    Task StartAsync(TimeSpan scanInterval, CancellationToken ct = default);
    Task StopAsync(CancellationToken ct = default);
    event EventHandler<WifiScanResult> ScanCompleted;
    event EventHandler<Exception> ScanFailed;
}
