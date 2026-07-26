using System.Windows.Forms;
using Point = System.Drawing.Point;
using Window = System.Windows.Window;

namespace BHB.Common.Helpers;

/// <summary>Ported from Honsen (HonsenApplications/Common/Helpers/WindowHelpers.cs).</summary>
public static class WindowHelpers
{
    /// <summary>
    /// The monitor the window's top-left corner sits on.
    /// </summary>
    /// <remarks>
    /// <see cref="Window.Left" />/<see cref="Window.Top" /> are device-independent units while
    /// <see cref="Screen" /> works in physical pixels. Under the System-DPI awareness that WPF
    /// uses by default those coordinate spaces agree, because Windows virtualises coordinates for
    /// system-aware processes. If BHB ever opts into PerMonitorV2 via an application manifest,
    /// this conversion — and the one in <c>BaseWindow.ApplyStartupScreenPlacement</c> — must be
    /// redone against each monitor's own DPI.
    /// </remarks>
    public static Screen GetCurrentScreen(this Window window)
    {
        var scale = Shared.Session.SystemScale <= 0d ? 1d : Shared.Session.SystemScale;
        var point = new Point((int)(window.Left * scale), (int)(window.Top * scale));

        return Screen.FromPoint(point);
    }
}
