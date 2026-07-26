namespace BHB.Features;

/// <summary>How the runner responds when a rule's template appears on screen.</summary>
public enum ActionResponse
{
    /// <summary>Click the matched template's center (for buttons).</summary>
    Click,
    /// <summary>Press Space — confirms the game's default/YES on a dialog.</summary>
    SendSpace,
    /// <summary>Press Escape — dismisses a dialog (used for out-of-resources).</summary>
    SendEscape
}

/// <summary>Stop condition for a single-activity run.</summary>
public enum RunMode
{
    /// <summary>Run exactly <c>TargetRuns</c> times, then stop.</summary>
    Count,
    /// <summary>Run until the activity reports its resource is depleted.</summary>
    UntilOutOfResources
}

/// <summary>Why a run stopped.</summary>
public enum RunStopReason
{
    CountReached,
    OutOfResources,
    Cancelled,
    Error
}

/// <summary>
/// One "if you see X, do Y" rule. The runner walks an ordered list of these each
/// tick and acts on the first template found on screen.
/// </summary>
public sealed record ReactiveAction(
    string TemplatePath,
    ActionResponse Response = ActionResponse.Click,
    bool CountsAsRun = false,
    bool IsOutOfResources = false);

/// <summary>Progress snapshot emitted as a run advances (for UI + logging).</summary>
public sealed record ActivityProgress(
    int RunsCompleted,
    int? TargetRuns,      // null in UntilOutOfResources mode
    string CurrentStep);  // friendly name of the template last acted on
