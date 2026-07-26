using System;
using System.IO;
using System.Windows;
using BHB.Common.Helpers;
using BHB.Common.Shared;
using BHB.Config;
using BHB.Core.Bot;
using BHB.Core.Vision;
using BHB.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

namespace BHB;

public partial class App : Application
{
    public static IServiceProvider Services { get; private set; } = null!;

    public static AppSettings Settings { get; private set; } = null!;

    protected override void OnStartup(StartupEventArgs e)
    {
        LogHelpers.Initialize(AppConstants.APP_NAME);
        Log.Information("BHB starting up");

        InitializeSession();

        var templatesDir = Path.Combine(AppContext.BaseDirectory, "Templates");
        Directory.CreateDirectory(templatesDir);

        var services = new ServiceCollection();
        services.AddSingleton<BotManager>();
        services.AddSingleton(_ => new TemplateLibrary(templatesDir));
        services.AddSingleton<TemplateMatcher>();
        services.AddSingleton<MainViewModel>();
        Services = services.BuildServiceProvider();

        base.OnStartup(e);
    }

    /// <summary>
    /// Seeds Session from disk and hands BaseWindow a callback for writing the monitor preference
    /// back, so BaseWindow never needs to know how BHB stores settings.
    /// </summary>
    private static void InitializeSession()
    {
        Settings = AppSettings.Instance;

        Session.LastScreenDeviceName = Settings.LastScreenDeviceName;
        Session.IsLastWindowMaximized = Settings.IsLastWindowMaximized;
        Session.SaveScreenPreference = () =>
        {
            Settings.LastScreenDeviceName = Session.LastScreenDeviceName;
            Settings.IsLastWindowMaximized = Session.IsLastWindowMaximized;
            Settings.Save();
        };
    }

    protected override void OnExit(ExitEventArgs e)
    {
        Log.CloseAndFlush();
        base.OnExit(e);
    }
}
