using System.Collections.Generic;

namespace BHB.ViewModels;

/// <summary>A game mode shown on the Features page as roadmap reference.</summary>
public sealed record PlannedFeature(string Name, string Description, string Icon, string IconBackground)
{
    /// <summary>
    /// True once the activity is implemented and selectable on an account. Everything is false
    /// today except World Boss, and the page labels the rest Planned so the roadmap never reads
    /// as working functionality.
    /// </summary>
    public bool IsAvailable { get; init; }
}

public static class PlannedFeatures
{
    public static IReadOnlyList<PlannedFeature> All { get; } =
    [
        new("Dungeons",   "Auto-farm zones with configurable difficulty and re-run count",         "Sword",         "#FFF3E0"),
        new("Raids",      "Configurable raid level and normal / hard mode",                        "Castle",        "#EDE7F6"),
        new("PVP",        "Auto-battle with configurable opponent slot 1–4",                       "AccountGroup",  "#E3F2FD"),
        new("World Boss", "Solo and team modes with tier and difficulty config",                   "Users",         "#FCE4EC") { IsAvailable = true },
        new("GVG",        "Guild vs Guild with opponent placement",                                "ShieldAccount", "#E8F5E9"),
        new("Invasion",   "Wave farming with auto wave-increase and max cap",                      "Alien",         "#FFF8E1"),
        new("Expedition", "Multi-difficulty with portal selection",                                "MapMarkerPath", "#E0F7FA"),
        new("Trials",     "Challenge automation with configurable difficulty",                     "Trophy",        "#F3E5F5"),
        new("Gauntlet",   "Extends Trials with gauntlet-specific logic",                           "Fencing",       "#FBE9E7"),
        new("Fishing",    "Auto-fish with hook detection",                                         "Fish",          "#E1F5FE"),
        new("Run All",    "Chain all activities in priority order, loop until out of resources",   "PlaylistPlay",  "#E8EAF6"),
        new("Familiars",  "Auto persuade or decline with configurable catch list",                 "Pets",          "#F1F8E9")
    ];
}
