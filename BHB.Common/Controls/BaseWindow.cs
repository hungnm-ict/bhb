using System;
using System.ComponentModel;
using System.Linq;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Forms;
using System.Windows.Interop;
using System.Windows.Media;
using BHB.Common.Extensions;
using BHB.Common.Helpers;
using BHB.Common.Shared;
using Microsoft.Win32;
using Serilog;
using FontFamily = System.Windows.Media.FontFamily;
using Window = System.Windows.Window;

namespace BHB.Common.Controls;

/// <summary>
/// Ported from Honsen (HonsenApplications/Common/Controls/BaseWindow.cs).
/// Provides resolution auto-scaling and remembers which monitor the app was last used on.
/// </summary>
public class BaseWindow : Window
{
    #region PROPERTIES

    public static readonly DependencyProperty IsFullScreenProperty = DependencyProperty.Register(
        nameof(IsFullScreen), typeof(bool), typeof(BaseWindow), new PropertyMetadata(false));

    public bool IsFullScreen
    {
        get
        {
            return (bool)GetValue(IsFullScreenProperty);
        }
        set
        {
            SetValue(IsFullScreenProperty, value);
        }
    }

    private Screen? _previousScreen;
    private bool _isLoaded;
    private double _actualWidth;
    private double _actualHeight;
    private double _actualMinWidth;
    private double _actualMinHeight;
    private double _actualMaxWidth;
    private double _actualMaxHeight;

    #endregion

    #region BUSINESS LOGIC

    private void InitializeUI()
    {
        Session.WindowLayers = [this];
        Title = Title.IsNullOrWhiteSpace() ? Session.AppName : Title;
        ShowInTaskbar = true;
        SnapsToDevicePixels = true;
        UseLayoutRounding = true;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;

        RenderOptions.SetBitmapScalingMode(this, BitmapScalingMode.HighQuality);
        RenderOptions.SetClearTypeHint(this, ClearTypeHint.Enabled);
        TextOptions.SetTextFormattingMode(this, TextFormattingMode.Ideal);
        TextOptions.SetTextRenderingMode(this, TextRenderingMode.Auto);

        _actualWidth = Width;
        _actualHeight = Height;
        _actualMinWidth = MinWidth;
        _actualMinHeight = MinHeight;
        _actualMaxWidth = MaxWidth;
        _actualMaxHeight = MaxHeight;

        ApplyAppFontFamily();
    }

    /// <summary>
    /// Honsen hard-codes its "SFProText" resource here. BHB's UI is Material Design and sets its
    /// own font, so the family is applied only when a theme actually declares "AppFontFamily" —
    /// otherwise the window keeps whatever font the app chose.
    /// </summary>
    private void ApplyAppFontFamily()
    {
        try
        {
            if (TryFindResource(AppConstants.RESOURCE_APP_FONT_FAMILY) is FontFamily appFontFamily)
            {
                TextElement.SetFontFamily(this, appFontFamily);
            }
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Cannot set FontFamily");
        }
    }

    public void AutoScaleUI(bool isStarted = false)
    {
        try
        {
            var source = PresentationSource.FromVisual(this);
            if (source?.CompositionTarget == null)
            {
                return;
            }

            var primaryScreen = Screen.PrimaryScreen;
            if (primaryScreen == null)
            {
                return;
            }

            if (Content is not FrameworkElement contentElement)
            {
                return;
            }

            Session.AppScale = 1d;
            Session.SystemScale = Math.Max(
                source.CompositionTarget.TransformToDevice.M11,
                source.CompositionTarget.TransformToDevice.M22);

            double taskBarSize;
            var isHorizontalTaskBar = primaryScreen.Bounds.Width == primaryScreen.WorkingArea.Width;

            if (isHorizontalTaskBar)
            {
                taskBarSize = primaryScreen.Bounds.Width - primaryScreen.WorkingArea.Width;
            }
            else
            {
                taskBarSize = primaryScreen.Bounds.Height - primaryScreen.WorkingArea.Height;
            }

            var resolutionWidth = primaryScreen.Bounds.Width - (isHorizontalTaskBar ? 0d : taskBarSize);
            var resolutionHeight = primaryScreen.Bounds.Height - (isHorizontalTaskBar ? taskBarSize : 0d);

            if (resolutionWidth < AppConstants.MAIN_APP_RECOMMEND_WIDTH || resolutionHeight < AppConstants.MAIN_APP_RECOMMEND_HEIGHT)
            {
                var scaleX = AppConstants.MAIN_APP_RECOMMEND_WIDTH / resolutionWidth;
                var scaleY = AppConstants.MAIN_APP_RECOMMEND_HEIGHT / resolutionHeight;

                Session.AppScale = Math.Max(scaleX, scaleY);
            }

            contentElement.LayoutTransform = new ScaleTransform
            {
                CenterX = 0d,
                CenterY = 0d,
                ScaleX = 1 / Session.SystemScale / Session.AppScale,
                ScaleY = 1 / Session.SystemScale / Session.AppScale
            };

            _actualWidth = double.IsNaN(_actualWidth) ? Width : _actualWidth;
            _actualHeight = double.IsNaN(_actualHeight) ? Height : _actualHeight;
            _actualMinWidth = double.IsNaN(_actualMinWidth) ? MinWidth : _actualMinWidth;
            _actualMinHeight = double.IsNaN(_actualMinHeight) ? MinHeight : _actualMinHeight;
            _actualMaxWidth = double.IsNaN(_actualMaxWidth) ? MaxWidth : _actualMaxWidth;
            _actualMaxHeight = double.IsNaN(_actualMaxHeight) ? MaxHeight : _actualMaxHeight;

            Width = _actualWidth / Session.SystemScale / Session.AppScale;
            Height = _actualHeight / Session.SystemScale / Session.AppScale;
            MinWidth = _actualMinWidth / Session.SystemScale / Session.AppScale;
            MinHeight = _actualMinHeight / Session.SystemScale / Session.AppScale;
            MaxWidth = _actualMaxWidth / Session.SystemScale / Session.AppScale;
            MaxHeight = _actualMaxHeight / Session.SystemScale / Session.AppScale;

            if (isStarted)
            {
                CentreOnScreen(GetTargetStartupScreen());
            }
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Cannot scale application automatically");
        }
        finally
        {
            _previousScreen = this.GetCurrentScreen();
        }
    }

    private void CentreOnScreen(Screen targetScreen)
    {
        var scale = Session.SystemScale <= 0d ? 1d : Session.SystemScale;
        var workingArea = targetScreen.WorkingArea;
        var areaLeft = workingArea.Left / scale;
        var areaTop = workingArea.Top / scale;
        var areaWidth = workingArea.Width / scale;
        var areaHeight = workingArea.Height / scale;

        WindowStartupLocation = WindowStartupLocation.Manual;
        Left = areaLeft + (areaWidth - Width) / 2;
        Top = areaTop + (areaHeight - Height) / 2;
    }

    private static Screen GetTargetStartupScreen()
    {
        if (!Session.LastScreenDeviceName.IsNullOrWhiteSpace())
        {
            var savedScreen = Screen.AllScreens.FirstOrDefault(screen => screen.DeviceName == Session.LastScreenDeviceName);
            if (savedScreen != null)
            {
                return savedScreen;
            }
        }

        return Screen.PrimaryScreen ?? Screen.AllScreens.First();
    }

    private Screen GetActualScreen()
    {
        var windowHandle = new WindowInteropHelper(this).Handle;
        if (windowHandle != IntPtr.Zero)
        {
            return Screen.FromHandle(windowHandle);
        }

        return this.GetCurrentScreen();
    }

    private void SaveCurrentScreenPreference()
    {
        try
        {
            var currentScreen = GetActualScreen();

            Session.LastScreenDeviceName = currentScreen.DeviceName;
            Session.IsLastWindowMaximized = WindowState == WindowState.Maximized;
            Session.SaveScreenPreference?.Invoke();
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Cannot save current screen preference");
        }
    }

    /// <summary>
    /// Refreshes <see cref="Session.SystemScale" /> straight from the window's presentation source.
    /// Startup placement happens before AutoScaleUI has ever run, so without this the very first
    /// window converts physical screen coordinates with a stale scale of 1.0 and lands on the wrong
    /// monitor on a high-DPI secondary display.
    /// </summary>
    private void RefreshSystemScale()
    {
        var source = PresentationSource.FromVisual(this);
        if (source?.CompositionTarget == null)
        {
            return;
        }

        Session.SystemScale = Math.Max(
            source.CompositionTarget.TransformToDevice.M11,
            source.CompositionTarget.TransformToDevice.M22);
    }

    private void ApplyStartupScreenPlacement()
    {
        try
        {
            RefreshSystemScale();

            // Position every top-level window on the saved monitor BEFORE it is shown, so it never
            // flashes on the cursor's/primary monitor first.
            var targetScreen = GetTargetStartupScreen();

            // Honsen reads WindowState here — the window's *current* state, which at startup is
            // whatever XAML declared, never the persisted value. That made IsLastWindowMaximized
            // write-only: saved on close, never restored. Read the saved flag instead.
            var shouldMaximize = Session.IsLastWindowMaximized || WindowState == WindowState.Maximized;

            if (shouldMaximize)
            {
                // Move onto the target monitor while Normal, then maximise there.
                var scale = Session.SystemScale <= 0d ? 1d : Session.SystemScale;
                var workingArea = targetScreen.WorkingArea;

                WindowStartupLocation = WindowStartupLocation.Manual;
                WindowState = WindowState.Normal;
                Left = workingArea.Left / scale + 40;
                Top = workingArea.Top / scale + 40;
                WindowState = WindowState.Maximized;
            }
            else
            {
                CentreOnScreen(targetScreen);
            }
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Cannot position window on target screen");
        }
    }

    #endregion

    #region EVENT HANDLERS

    protected override void OnInitialized(EventArgs e)
    {
        base.OnInitialized(e);
        InitializeUI();

        Loaded += BaseWindow_OnLoaded;
        LocationChanged += BaseWindow_OnLocationChanged;
        SystemEvents.DisplaySettingsChanged += SystemEvents_OnDisplaySettingsChanged;
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        ApplyStartupScreenPlacement();
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        // Persist the monitor (and maximized state) the window is on as it closes. This is the
        // reliable "where was the app last" signal and avoids saving during startup positioning.
        SaveCurrentScreenPreference();
        base.OnClosing(e);
    }

    protected override void OnClosed(EventArgs e)
    {
        // Static event — without this the window is rooted for the life of the process.
        SystemEvents.DisplaySettingsChanged -= SystemEvents_OnDisplaySettingsChanged;
        Session.WindowLayers.Remove(this);
        base.OnClosed(e);
    }

    private void SystemEvents_OnDisplaySettingsChanged(object? sender, EventArgs e)
    {
        AutoScaleUI(true);
    }

    private void BaseWindow_OnLocationChanged(object? sender, EventArgs e)
    {
        if (Equals(_previousScreen, this.GetCurrentScreen()))
        {
            return;
        }

        AutoScaleUI();

        // Persist as soon as the user drags onto another monitor, not only on close.
        if (_isLoaded)
        {
            SaveCurrentScreenPreference();
        }
    }

    private void BaseWindow_OnLoaded(object sender, RoutedEventArgs e)
    {
        // Honsen re-centres here unconditionally. That would undo a restored maximised window, so
        // the startup re-centre is skipped when the window came back maximised.
        AutoScaleUI(WindowState != WindowState.Maximized);
        _isLoaded = true;
    }

    #endregion
}
