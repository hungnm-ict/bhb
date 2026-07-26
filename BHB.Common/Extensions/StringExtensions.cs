using System.Diagnostics.CodeAnalysis;

namespace BHB.Common.Extensions;

/// <summary>Ported from Honsen (HonsenApplications/Common/Extensions).</summary>
public static class StringExtensions
{
    public static bool IsNullOrWhiteSpace([NotNullWhen(false)] this string? value)
    {
        return string.IsNullOrWhiteSpace(value);
    }

    public static bool IsNotNullOrWhiteSpace([NotNullWhen(true)] this string? value)
    {
        return !string.IsNullOrWhiteSpace(value);
    }
}
