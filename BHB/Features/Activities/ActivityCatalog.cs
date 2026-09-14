using System;
using System.Collections.Generic;
using System.Linq;

namespace BHB.Features.Activities;

/// <summary>
/// The activities the bot can actually run, by display name.
/// </summary>
/// <remarks>
/// Only entries listed here appear in an account's activity dropdown. The other game modes shown
/// on the Features page are roadmap items with no definition and no captured templates, so they
/// are deliberately absent — offering them would only produce runs that fail on missing templates.
/// </remarks>
public static class ActivityCatalog
{
    private static readonly Dictionary<string, Func<ActivityDefinition>> Factories = new(StringComparer.OrdinalIgnoreCase)
    {
        ["World Boss"] = WorldBossActivity.Create
    };

    public static IReadOnlyList<string> Names
    {
        get
        {
            return Factories.Keys.ToList();
        }
    }

    public static string DefaultName
    {
        get
        {
            return Factories.Keys.First();
        }
    }

    /// <summary>Builds the definition for <paramref name="name"/>, or null when unknown.</summary>
    public static ActivityDefinition? Create(string? name)
    {
        if (name == null || !Factories.TryGetValue(name, out var factory))
        {
            return null;
        }

        return factory();
    }
}
