using System;
using System.IO;
using System.Windows;
using BHB.Common.Helpers;
using BHB.Core.Bot;
using BHB.Core.Vision;
using BHB.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

namespace BHB;

public partial class App : Application
{
    public static IServiceProvider Services { get; private set; } = null!;

    protected override void OnStartup(StartupEventArgs e)
    {
        LogHelpers.Initialize("BHB");
        Log.Information("BHB starting up");

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

    protected override void OnExit(ExitEventArgs e)
    {
        Log.CloseAndFlush();
        base.OnExit(e);
    }
}
