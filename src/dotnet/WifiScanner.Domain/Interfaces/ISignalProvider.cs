using WifiScanner.Domain.Models;

namespace WifiScanner.Domain.Interfaces;

public interface ISignalProvider
{
    string ProviderName { get; }
    bool IsAvailable { get; }
    SignalSnapshot CurrentSnapshot { get; }
    event EventHandler<SignalSnapshot> SnapshotUpdated;
}
