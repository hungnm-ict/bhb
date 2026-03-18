using System;
using System.Threading;
using System.Threading.Tasks;
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

    public BotInstance(string accountName)
    {
        AccountName = accountName;
        _log = Log.ForContext("Account", accountName);
    }

    public async Task StartAsync(IFeature feature)
    {
        _cts = new CancellationTokenSource();
        State.Transition(BotState.Starting);
        _log.Information("Starting bot for {Account} running {Feature}", AccountName, feature.Name);
        await RunLoopAsync(feature, _cts.Token);
    }

    public void Stop()
    {
        _cts?.Cancel();
        State.Transition(BotState.Stopped);
        _log.Information("Bot stopped for {Account}", AccountName);
    }

    public void Pause() => _cts?.Cancel();

    private async Task RunLoopAsync(IFeature feature, CancellationToken ct)
    {
        State.Transition(BotState.Running);
        try
        {
            while (!ct.IsCancellationRequested)
            {
                var result = await feature.ExecuteOnceAsync(this, ct);
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
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _log.Error(ex, "Bot loop crashed for {Account}", AccountName);
            State.Transition(BotState.Dead);
        }
    }
}
