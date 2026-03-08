using Microsoft.Extensions.Logging;
using WiFiScanner.App.Services;
using WiFiScanner.Core.Services;
using WiFiScanner.Domain.Interfaces;

namespace WiFiScanner.App;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

        builder.Services.AddMauiBlazorWebView();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        // Register services
        RegisterPlatformServices(builder.Services);
        builder.Services.AddSingleton<SignalAggregator>();
        builder.Services.AddSingleton<ScanningCoordinator>();

        return builder.Build();
    }

    private static void RegisterPlatformServices(IServiceCollection services)
    {
#if ANDROID
        services.AddSingleton<IWiFiScanner, AndroidWiFiScanner>();
        services.AddSingleton<IOrientationProvider, MauiOrientationProvider>();
#elif IOS || MACCATALYST
        // iOS severely restricts Wi-Fi scanning
        services.AddSingleton<IWiFiScanner, MockWiFiScanner>();
        services.AddSingleton<IOrientationProvider, MauiOrientationProvider>();
#elif WINDOWS
        services.AddSingleton<IWiFiScanner, WindowsWiFiScanner>();
        services.AddSingleton<IOrientationProvider, MockOrientationProvider>();
#else
        services.AddSingleton<IWiFiScanner, MockWiFiScanner>();
        services.AddSingleton<IOrientationProvider, MockOrientationProvider>();
#endif
    }
}
