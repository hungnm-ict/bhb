namespace BHB.Common.Shared;

/// <summary>
/// Ported from Honsen (HonsenApplications/Common/Shared/AppConstants.cs), trimmed to the constants
/// BaseWindow uses.
/// </summary>
public static class AppConstants
{
    /// <summary>
    /// Product name. Also the folder name under %AppData% and the Serilog log directory.
    /// </summary>
    public const string APP_NAME = "BHB";

    /// <summary>
    /// Resource key a theme can declare to override the window font. BaseWindow applies it only
    /// when found, so the key has to match exactly for the lookup to succeed.
    /// </summary>
    public const string RESOURCE_APP_FONT_FAMILY = "AppFontFamily";

    /// <summary>
    /// The resolution the UI is designed against. When the screen's usable area is smaller than
    /// this, BaseWindow.AutoScaleUI shrinks the whole window so the layout still fits.
    /// </summary>
    public const double MAIN_APP_RECOMMEND_WIDTH = 1920d;

    public const double MAIN_APP_RECOMMEND_HEIGHT = 1080d;
}
