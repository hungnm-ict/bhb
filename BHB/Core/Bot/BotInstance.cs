using System;
using System.Threading;
using System.Threading.Tasks;
using BHB.Core.Input;
using BHB.Core.Vision;
using BHB.Features;
using BHB.Features.Base;
using Serilog;

namespace BHB.Core.Bot;

public class BotInstance
{
    public string AccountName { get; }
    public IntPtr Hwnd { get; set; }
    public StateMachine State { get; } = new();

    private CancellationTokenSource? _cts;
    private readonly ILogger _log;
    private readonly ClickCoordinator _clickCoordinator;

    public BotInstance(string accountName, ClickCoordinator clickCoordinator)
    {
        AccountName = accountName;
        _clickCoordinator = clickCoordinator;
        _log = Log.ForContext("Account", accountName);
    }

    public async Task StartAsync(IFeature feature)
    {
        var cancellation = ResetCancellation();
        State.Transition(BotState.Starting);
        _log.Information("Starting bot for {Account} running {Feature}", AccountName, feature.Name);
        await RunLoopAsync(feature, cancellation.Token);
    }

    public void Stop()
    {
        _cts?.Cancel();
        State.Transition(BotState.Stopped);
        _log.Information("Bot stopped for {Account}", AccountName);
    }

    public void Pause()
    {
        _cts?.Cancel();
    }

    /// <summary>
    /// Replaces the run's cancellation source, disposing any previous one so repeated
    /// start/stop cycles do not leak a CancellationTokenSource each time.
    /// </summary>
    private CancellationTokenSource ResetCancellation()
    {
        _cts?.Dispose();
        _cts = new CancellationTokenSource();

        return _cts;
    }

    /// <summary>
    /// Runs a single activity (World Boss, etc.) via the reactive <see cref="ActivityRunner"/>,
    /// stopping on the chosen <paramref name="mode"/>. Cancel by calling <see cref="Stop"/>.
    /// </summary>
    public async Task<RunStopReason> RunActivityAsync(
        ActivityDefinition activity,
        RunMode mode,
        int targetRuns,
        TemplateLibrary templates,
        TemplateMatcher matcher,
        IProgress<ActivityProgress>? progress = null,
        IProgress<string>? log = null)
    {
        var cancellation = ResetCancellation();

        var frames = new WindowFrameSource(Hwnd);
        var input = new WindowInputSink(Hwnd, _clickCoordinator);
        var runner = new ActivityRunner(frames, input, matcher, templates);
        if (progress != null)
        {
            runner.Progress += update => progress.Report(update);
        }

        if (log != null)
        {
            runner.Log += message => log.Report(message);
        }

        State.Transition(BotState.Starting);
        State.Transition(BotState.Running);
        _log.Information("Running {Activity} (mode={Mode}, target={Target}) for {Account}",
            activity.Name, mode, targetRuns, AccountName);

        var reason = await runner.RunAsync(activity, mode, targetRuns, cancellation.Token);

        State.Transition(reason switch
        {
            RunStopReason.OutOfResources => BotState.OutOfResources,
            RunStopReason.Error          => BotState.Dead,
            _                            => BotState.Stopped
        });
        _log.Information("{Activity} stopped for {Account}: {Reason}", activity.Name, AccountName, reason);
        return reason;
    }

    private async Task RunLoopAsync(IFeature feature, CancellationToken cancellationToken)
    {
        State.Transition(BotState.Running);
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var result = await feature.ExecuteOnceAsync(this, cancellationToken);
                switch (result)
                {
                    case FeatureResult.Continue:
                        break;
                    case FeatureResult.Rerun:
                        State.Transition(BotState.Rerunning);
                        State.Transition(BotState.Running);
                        break;
                    case FeatureResult.OutOfResources:
                        State.Transition(BotState.OutOfResources);
                        return;
                    case FeatureResult.Dead:
                        State.Transition(BotState.Dead);
                        return;
                    case FeatureResult.Disconnected:
                        State.Transition(BotState.Disconnected);
                        return;
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Stop() cancels the token — an expected end to the loop, not a failure.
            _log.Information("Bot loop cancelled for {Account}", AccountName);
        }
        catch (Exception ex)
        {
            _log.Error(ex, "Bot loop crashed for {Account}", AccountName);
            State.Transition(BotState.Dead);
        }
    }
}
