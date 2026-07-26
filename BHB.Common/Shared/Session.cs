using System;
using System.Collections.Generic;
using System.Windows;

namespace BHB.Common.Shared;

/// <summary>
/// App-wide runtime state shared by <see cref="Controls.BaseWindow" />.
/// Ported from Honsen (HonsenApplications/Common/Shared/Session.cs), trimmed to the members
/// BaseWindow actually needs — the Honsen original also carries staff/database/loading state
/// that has no counterpart in BHB.
/// </summary>
public static class Session
{
    public static string AppName { get; set; } = AppConstants.APP_NAME;

    /// <summary>Top-level windows, innermost last. Dialogs use this to pick their owner.</summary>
    public static List<Window> WindowLayers { get; set; } = [];

    /// <summary>Windows DPI scale (1.0 at 96 DPI, 1.5 at 150%). Set by BaseWindow.AutoScaleUI.</summary>
    public static double SystemScale { get; set; } = 1d;

    /// <summary>Extra shrink applied when the screen is smaller than the recommended resolution.</summary>
    public static double AppScale { get; set; } = 1d;

    /// <summary><see cref="System.Windows.Forms.Screen.DeviceName" /> of the monitor last used.</summary>
    public static string LastScreenDeviceName { get; set; } = string.Empty;

    public static bool IsLastWindowMaximized { get; set; }

    /// <summary>
    /// Storage seam. The app layer assigns this to flush the two values above to disk, which keeps
    /// BaseWindow independent of how BHB persists settings. Null means "don't persist".
    /// </summary>
    public static Action? SaveScreenPreference { get; set; }
}
