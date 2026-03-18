using System;
using System.Threading;
using System.Threading.Tasks;
using BHB.Core.Bot;
using BHB.Core.Capture;
using BHB.Core.Vision;

namespace BHB.Features.Base;

public abstract class BaseFeature : IFeature
{
    protected readonly TemplateMatcher Matcher;
    protected readonly TemplateLibrary Templates;

    protected BaseFeature(TemplateLibrary templates, double threshold = 0.85)
    {
        Templates = templates;
        Matcher   = new TemplateMatcher(threshold);
    }

    public abstract string Name { get; }
    public abstract Task<FeatureResult> ExecuteOnceAsync(BotInstance bot, CancellationToken ct);

    protected async Task<bool> WaitForTemplate(BotInstance bot, string templatePath, int timeoutMs, CancellationToken ct)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        var template = Templates.Get(templatePath);
        while (DateTime.UtcNow < deadline && !ct.IsCancellationRequested)
        {
            using var screen = WindowCapture.CaptureAsMat(bot.Hwnd);
            if (screen != null)
            {
                var pt = Matcher.FindTemplate(screen, template);
                if (pt != null) return true;
            }
            await Task.Delay(500, ct);
        }
        return false;
    }

    protected async Task ClickTemplate(BotInstance bot, string templatePath, CancellationToken ct)
    {
        using var screen = WindowCapture.CaptureAsMat(bot.Hwnd);
        if (screen == null) return;
        var template = Templates.Get(templatePath);
        Matcher.FindAndClick(bot.Hwnd, screen, template);
        await Task.Delay(100, ct);
    }

    protected static Task Sleep(int ms, CancellationToken ct) => Task.Delay(ms, ct);
}
