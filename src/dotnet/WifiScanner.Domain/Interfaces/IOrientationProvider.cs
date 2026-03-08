using WifiScanner.Domain.Models;

namespace WifiScanner.Domain.Interfaces;

public interface IOrientationProvider
{
    string ProviderName { get; }
    bool IsAvailable { get; }
    bool RequiresPermission { get; }
    Task<bool> RequestPermissionAsync(CancellationToken ct = default);
    Task StartAsync(CancellationToken ct = default);
    Task StopAsync(CancellationToken ct = default);
    event EventHandler<OrientationData> OrientationChanged;
}
