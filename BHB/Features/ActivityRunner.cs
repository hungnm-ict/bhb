using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using BHB.Core.Vision;
using OpenCvSharp;

namespace BHB.Features;

/// <summary>
/// Generic reactive tick loop that drives one <see cref="ActivityDefinition"/>:
/// each tick it finds the first on-screen action and responds to it, counting
/// completed runs and stopping on count reached, out of resources, or cancellation.
/// </summary>
public sealed class ActivityRunner
{
    private readonly IFrameSource _frames;
    private readonly IInputSink _input;
    private readonly TemplateMatcher _matcher;
    private readonly TemplateLibrary _templates;
    private readonly HashSet<string> _reportedMissingTemplates = [];

    public ActivityRunner(IFrameSource frames, IInputSink input, TemplateMatcher matcher, TemplateLibrary templates)
    {
        _frames = frames;
        _input = input;
        _matcher = matcher;
        _templates = templates;
    }

    /// <summary>Raised whenever an action is acted on (for UI + logging).</summary>
    public event Action<ActivityProgress>? Progress;

    /// <summary>Raised with human-readable diagnostics for the on-screen log.</summary>
    public event Action<string>? Log;

    public async Task<RunStopReason> RunAsync(ActivityDefinition activity, RunMode mode, int targetRuns, CancellationToken cancellationToken)
    {
        int completed = 0;
        int consecutiveMisses = 0;
        int? target = mode == RunMode.Count ? targetRuns : null;

        try
        {
            while (true)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    return RunStopReason.Cancelled;
                }

                if (mode == RunMode.Count && completed >= targetRuns)
                {
                    return RunStopReason.CountReached;
                }

                using var frame = _frames.Capture();
                if (frame == null)
                {
                    Log?.Invoke("capture returned null — skipping tick");
                    await Task.Delay(activity.LoopIntervalMs, cancellationToken);
                    continue;
                }

                var outcome = HandleActions(activity, frame, ref completed, target);
                if (outcome == ActionOutcome.OutOfResources)
                {
                    return RunStopReason.OutOfResources;
                }

                if (outcome == ActionOutcome.Matched)
                {
                    consecutiveMisses = 0;
                }
                else
                {
                    consecutiveMisses++;
                    if (consecutiveMisses >= activity.ReentryAfterMisses && activity.EntryIcon != null)
                    {
                        Log?.Invoke($"no matches for {consecutiveMisses} ticks — trying to re-enter via {StepLabel(activity.EntryIcon)}");
                        TryClickTemplate(activity.EntryIcon, frame);
                        consecutiveMisses = 0;
                    }
                }

                await Task.Delay(activity.LoopIntervalMs, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            return RunStopReason.Cancelled;
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "ActivityRunner loop crashed for {Activity}", activity.Name);
            return RunStopReason.Error;
        }
    }

    private enum ActionOutcome
    {
        None,
        Matched,
        OutOfResources
    }

    private ActionOutcome HandleActions(ActivityDefinition activity, Mat frame, ref int completed, int? target)
    {
        foreach (var action in activity.Actions)
        {
            var template = TryGetTemplate(action.TemplatePath);
            if (template == null)
            {
                continue;
            }

            var point = _matcher.FindTemplate(frame, template);
            if (point == null)
            {
                continue;
            }

            var name = StepLabel(action.TemplatePath);
            switch (action.Response)
            {
                case ActionResponse.Click:
                    Log?.Invoke($"matched {name} → click frame({(int)point.Value.X},{(int)point.Value.Y})");
                    _input.Click((int)point.Value.X, (int)point.Value.Y);
                    break;
                case ActionResponse.SendSpace:
                    Log?.Invoke($"matched {name} → Space");
                    _input.SendSpace();
                    break;
                case ActionResponse.SendEscape:
                    Log?.Invoke($"matched {name} → Escape");
                    _input.SendEscape();
                    break;
            }

            if (action.CountsAsRun)
            {
                completed++;
            }

            Progress?.Invoke(new ActivityProgress(completed, target, name));

            if (action.IsOutOfResources)
            {
                return ActionOutcome.OutOfResources;
            }

            return ActionOutcome.Matched;
        }

        return ActionOutcome.None;
    }

    private void TryClickTemplate(string templatePath, Mat frame)
    {
        var template = TryGetTemplate(templatePath);
        if (template == null)
        {
            return;
        }

        var point = _matcher.FindTemplate(frame, template);
        if (point != null)
        {
            _input.Click((int)point.Value.X, (int)point.Value.Y);
        }
    }

    /// <summary>
    /// Loads a template, or returns null if the file is missing. <see cref="TemplateLibrary.Get" />
    /// throws for an absent file, which would otherwise reach the loop's catch-all and end the
    /// whole run as an error — one un-captured template should cost its own rule, not the run.
    /// Each missing path is reported once so a broken tick does not flood the log.
    /// </summary>
    private Mat? TryGetTemplate(string templatePath)
    {
        try
        {
            return _templates.Get(templatePath);
        }
        catch (FileNotFoundException)
        {
            if (_reportedMissingTemplates.Add(templatePath))
            {
                Log?.Invoke($"template missing, rule skipped: {templatePath}");
                Serilog.Log.Warning("Template missing, rule skipped: {TemplatePath}", templatePath);
            }

            return null;
        }
    }

    private static string StepLabel(string templatePath)
    {
        return Path.GetFileNameWithoutExtension(templatePath);
    }
}
