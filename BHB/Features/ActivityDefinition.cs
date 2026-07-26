using System.Collections.Generic;

namespace BHB.Features;

/// <summary>
/// An activity expressed as data: an ordered list of reactive rules plus how to
/// (re)enter the activity when the runner gets lost. Reused for every game mode.
/// </summary>
public sealed class ActivityDefinition
{
    public required string Name { get; init; }

    /// <summary>Ordered rules; the runner acts on the first one found each tick.</summary>
    public required IReadOnlyList<ReactiveAction> Actions { get; init; }

    /// <summary>Template clicked to (re)enter the activity after repeated misses. Optional.</summary>
    public string? EntryIcon { get; init; }

    public int LoopIntervalMs { get; init; } = 2000;

    /// <summary>Consecutive ticks with no match before attempting to re-enter via <see cref="EntryIcon"/>.</summary>
    public int ReentryAfterMisses { get; init; } = 6;
}
