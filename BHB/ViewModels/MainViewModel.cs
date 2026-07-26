using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using BHB.Common.Shared;
using BHB.Common.ViewModels;
using BHB.Core.Bot;
using BHB.Core.Capture;
using BHB.Core.Input;
using BHB.Core.Vision;
using BHB.Core.Win32;
using BHB.Features;
using BHB.Features.Activities;
using Serilog;

namespace BHB.ViewModels;

public class MainViewModel : BaseViewModel
{
    private readonly BotManager _botManager;
    private readonly TemplateLibrary _templates;
    private readonly TemplateMatcher _matcher;
    private BotInstance? _testInstance;
    private BotInstance? _runInstance;
    private bool _activityRunning;

    public ObservableCollection<GameWindowInfo> AvailableWindows { get; } = new();

    private GameWindowInfo? _selectedWindow;
    public GameWindowInfo? SelectedWindow
    {
        get => _selectedWindow;
        set => SetProperty(ref _selectedWindow, value);
    }

    private BitmapSource? _lastCapture;
    public BitmapSource? LastCapture
    {
        get => _lastCapture;
        set => SetProperty(ref _lastCapture, value);
    }

    private string _currentState = "Idle";
    public string CurrentState
    {
        get => _currentState;
        set => SetProperty(ref _currentState, value);
    }

    private string _logOutput = string.Empty;
    public string LogOutput
    {
        get => _logOutput;
        set => SetProperty(ref _logOutput, value);
    }

    private bool _demoRunning;

    // ── Activity Runner ──
    public ObservableCollection<string> Activities { get; } = new() { "World Boss" };

    private string _selectedActivity = "World Boss";
    public string SelectedActivity
    {
        get => _selectedActivity;
        set => SetProperty(ref _selectedActivity, value);
    }

    private bool _isCountMode = true;
    public bool IsCountMode
    {
        get => _isCountMode;
        set => SetProperty(ref _isCountMode, value);
    }

    private int _runCount = 10;
    public int RunCount
    {
        get => _runCount;
        set => SetProperty(ref _runCount, value);
    }

    private string _runStatus = "Idle";
    public string RunStatus
    {
        get => _runStatus;
        set => SetProperty(ref _runStatus, value);
    }

    public ICommand RefreshWindowsCommand { get; }
    public ICommand CaptureTestCommand    { get; }
    public ICommand SaveCaptureCommand     { get; }
    public ICommand ClickTestCommand      { get; }
    public ICommand DemoQuestCommand      { get; }
    public ICommand DemoTouchCommand      { get; }
    public ICommand StartCommand          { get; }
    public ICommand StopCommand           { get; }
    public ICommand StartRunCommand       { get; }
    public ICommand StopRunCommand        { get; }
    public ICommand DiagnoseCommand       { get; }

    public MainViewModel(BotManager botManager, TemplateLibrary templates, TemplateMatcher matcher)
    {
        _botManager = botManager;
        _templates  = templates;
        _matcher    = matcher;

        RefreshWindowsCommand = new RelayCommand(_ => RefreshWindows());
        CaptureTestCommand    = new RelayCommand(_ => CaptureTest(),        _ => SelectedWindow != null);
        SaveCaptureCommand    = new RelayCommand(_ => SaveCapture(),        _ => LastCapture != null);
        ClickTestCommand      = new RelayCommand(_ => ClickTest(),          _ => SelectedWindow != null);
        DemoQuestCommand      = new RelayCommand(_ => _ = DemoQuestAsync(), _ => SelectedWindow != null && !_demoRunning);
        DemoTouchCommand      = new RelayCommand(_ => _ = DemoTouchAsync(), _ => SelectedWindow != null && !_demoRunning);
        StartCommand          = new RelayCommand(_ => Start(),              _ => SelectedWindow != null);
        StopCommand           = new RelayCommand(_ => Stop(),               _ => _testInstance  != null);
        StartRunCommand       = new RelayCommand(_ => _ = StartRunAsync(),  _ => SelectedWindow != null && !_activityRunning);
        StopRunCommand        = new RelayCommand(_ => StopRun(),            _ => _activityRunning);
        DiagnoseCommand       = new RelayCommand(_ => Diagnose(),           _ => SelectedWindow != null);

        var isTouchAvailable = WindowInput.InitTouch();
        AppendLog(isTouchAvailable ? "Touch injection initialised." : "Touch injection unavailable.");

        RefreshWindows();
    }

    private void RefreshWindows()
    {
        AvailableWindows.Clear();
        foreach (var w in WindowFinder.FindAll())
            AvailableWindows.Add(w);
        AppendLog($"Found {AvailableWindows.Count} game window(s).");
    }

    private void CaptureTest()
    {
        if (SelectedWindow == null)
        {
            return;
        }

        var bitmap = WindowCapture.Capture(SelectedWindow.Hwnd);
        if (bitmap == null)
        {
            AppendLog("Capture returned null.");
            return;
        }

        LastCapture = ToBitmapSource(bitmap);
        bitmap.Dispose();
        AppendLog($"Captured: {SelectedWindow.Title} — {(int)SelectedWindow.ClientRect.Width}x{(int)SelectedWindow.ClientRect.Height}");
        CommandManager.InvalidateRequerySuggested();
    }

    private void SaveCapture()
    {
        if (LastCapture == null)
        {
            AppendLog("Nothing to save — run Capture Test first.");
            return;
        }

        var dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            AppConstants.APP_NAME, "captures");
        Directory.CreateDirectory(dir);

        var path = Path.Combine(dir, $"capture_{DateTime.Now:yyyyMMdd_HHmmss}.png");
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(LastCapture));
        using (var stream = File.Create(path))
        {
            encoder.Save(stream);
        }

        AppendLog($"Saved capture → {path}");
    }

    private void ClickTest()
    {
        if (SelectedWindow == null)
        {
            return;
        }

        // Same target as Demo (Quest button) so PostMessage vs ClickFocused are directly comparable
        WindowInput.Click(SelectedWindow.Hwnd, QuestBtnX, QuestBtnY);
        AppendLog($"PostMessage+WM_MOUSEMOVE click → ({QuestBtnX},{QuestBtnY}) client coords");
    }

    // Quest button is on the left sidebar: icon roughly at (27, 88) in client coords.
    // Adjust these if your game window is a different size.
    private const int QuestBtnX = 27;
    private const int QuestBtnY = 88;

    private async Task DemoQuestAsync()
    {
        if (SelectedWindow == null || _demoRunning)
        {
            return;
        }

        _demoRunning = true;
        CommandManager.InvalidateRequerySuggested();

        var hwnd = SelectedWindow.Hwnd;
        try
        {
            AppendLog($"Demo: clicking Quest btn ({QuestBtnX},{QuestBtnY}) via ClickFocused…");
            await Task.Run(() => WindowInput.ClickFocused(hwnd, QuestBtnX, QuestBtnY));

            AppendLog("Demo: waiting 1.5 s then capturing result…");
            await Task.Delay(1500);

            // Capture and show — if Quest map opened you'll see it in the preview
            var bitmap = WindowCapture.Capture(hwnd);
            if (bitmap != null)
            {
                LastCapture = ToBitmapSource(bitmap);
                bitmap.Dispose();
                AppendLog("Demo: captured — check preview to see if Quest map opened.");
            }

            await Task.Delay(500);
            AppendLog("Demo: pressing Escape to close…");
            await Task.Run(() => WindowInput.SendEscape(hwnd));
        }
        finally
        {
            _demoRunning = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async Task DemoTouchAsync()
    {
        if (SelectedWindow == null || _demoRunning)
        {
            return;
        }

        _demoRunning = true;
        CommandManager.InvalidateRequerySuggested();

        var hwnd = SelectedWindow.Hwnd;
        try
        {
            AppendLog($"Demo Touch: injecting touch tap at ({QuestBtnX},{QuestBtnY}) — no cursor movement…");
            await Task.Run(() => WindowInput.ClickTouch(hwnd, QuestBtnX, QuestBtnY));

            AppendLog("Demo Touch: waiting 1.5 s then capturing result…");
            await Task.Delay(1500);

            var bitmap = WindowCapture.Capture(hwnd);
            if (bitmap != null)
            {
                LastCapture = ToBitmapSource(bitmap);
                bitmap.Dispose();
                AppendLog("Demo Touch: captured — check preview to see if Quest map opened.");
            }

            await Task.Delay(500);
            AppendLog("Demo Touch: pressing Escape to close…");
            await Task.Run(() => WindowInput.SendEscape(hwnd));
        }
        finally
        {
            _demoRunning = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private void Start()
    {
        if (SelectedWindow == null)
        {
            return;
        }

        _testInstance = _botManager.CreateInstance("Test");
        _testInstance.Hwnd = SelectedWindow.Hwnd;
        _testInstance.State.StateChanged += (_, to) =>
            Application.Current.Dispatcher.Invoke(() => CurrentState = to.ToString());
        _testInstance.State.Transition(BotState.Starting);
        _testInstance.State.Transition(BotState.Running);
        AppendLog("Bot instance created — state machine demo active.");
    }

    private void Stop()
    {
        _testInstance?.Stop();
        _testInstance = null;
    }

    private async Task StartRunAsync()
    {
        if (SelectedWindow == null || _activityRunning)
        {
            return;
        }

        var activity = WorldBossActivity.Create();

        var missing = FindMissingTemplates(activity);
        if (missing.Count > 0)
        {
            AppendLog($"Cannot start — missing templates: {string.Join(", ", missing)}");
            RunStatus = "Missing templates";
            return;
        }

        _activityRunning = true;
        CommandManager.InvalidateRequerySuggested();

        _runInstance = _botManager.CreateInstance("WB");
        _runInstance.Hwnd = SelectedWindow.Hwnd;
        _runInstance.State.StateChanged += (_, to) =>
            Application.Current.Dispatcher.Invoke(() => CurrentState = to.ToString());

        var mode   = IsCountMode ? RunMode.Count : RunMode.UntilOutOfResources;
        var target = IsCountMode ? Math.Max(1, RunCount) : 0;

        var progress = new Progress<ActivityProgress>(p =>
        {
            var goal = p.TargetRuns.HasValue ? p.TargetRuns.Value.ToString() : "∞";
            RunStatus = $"Runs {p.RunsCompleted}/{goal} — {p.CurrentStep}";
        });
        var runLog = new Progress<string>(message => AppendLog($"[run] {message}"));

        AppendLog($"Starting {activity.Name} — {(IsCountMode ? $"{target} runs" : "until out of resources")}");
        RunStatus = "Running…";

        try
        {
            var reason = await Task.Run(() =>
                _runInstance.RunActivityAsync(activity, mode, target, _templates, _matcher, progress, runLog));
            AppendLog($"{activity.Name} finished: {reason}");
            RunStatus = $"Stopped: {reason}";
        }
        catch (Exception ex)
        {
            AppendLog($"Activity error: {ex.Message}");
            RunStatus = "Error";
        }
        finally
        {
            _botManager.RemoveInstance("WB");
            _runInstance = null;
            _activityRunning = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private void StopRun()
    {
        _runInstance?.Stop();
        AppendLog("Stop requested.");
    }

    /// <summary>
    /// One-shot diagnostic: capture the current frame and report, to the on-screen log,
    /// whether capture worked plus the best match score for every World Boss template.
    /// Run it while a World Boss screen with a visible button is showing.
    /// </summary>
    private void Diagnose()
    {
        if (SelectedWindow == null)
        {
            return;
        }

        var frames = new WindowFrameSource(SelectedWindow.Hwnd);
        using var frame = frames.Capture();
        if (frame == null)
        {
            AppendLog("DIAG: capture returned NULL — WindowCapture failed for this hwnd.");
            return;
        }

        AppendLog($"DIAG: frame {frame.Width}x{frame.Height}, channels={frame.Channels()}, type={frame.Type()}");

        if (NativeMethods.GetWindowRect(SelectedWindow.Hwnd, out var winRect) &&
            NativeMethods.GetClientRect(SelectedWindow.Hwnd, out var cliRect))
        {
            var origin = new POINT { X = 0, Y = 0 };
            NativeMethods.ClientToScreen(SelectedWindow.Hwnd, ref origin);
            int offsetX = origin.X - winRect.Left;
            int offsetY = origin.Y - winRect.Top;
            AppendLog($"DIAG: window {winRect.Right - winRect.Left}x{winRect.Bottom - winRect.Top}, " +
                      $"client {cliRect.Right - cliRect.Left}x{cliRect.Bottom - cliRect.Top}, " +
                      $"chrome offset ({offsetX},{offsetY})");
        }

        var activity = WorldBossActivity.Create();
        var templatesDir = Path.Combine(AppContext.BaseDirectory, "Templates");

        foreach (var action in activity.Actions)
        {
            ReportTemplateScore(frame, templatesDir, action.TemplatePath);
        }

        if (activity.EntryIcon != null)
        {
            ReportTemplateScore(frame, templatesDir, activity.EntryIcon);
        }

        AppendLog($"DIAG: threshold is 0.85 — any score >= 0.85 would match.");
    }

    private void ReportTemplateScore(OpenCvSharp.Mat frame, string templatesDir, string relativePath)
    {
        try
        {
            var full = Path.Combine(templatesDir, relativePath);
            if (!File.Exists(full))
            {
                AppendLog($"DIAG: {relativePath} — FILE MISSING at {full}");
                return;
            }

            var template = _templates.Get(relativePath);
            var best = _matcher.FindBest(frame, template);
            var name = Path.GetFileNameWithoutExtension(relativePath);
            if (best == null)
            {
                AppendLog($"DIAG best=n/a  {name} (template larger than frame)");
                return;
            }

            AppendLog($"DIAG best={best.Value.Score:F3} @scale={best.Value.Scale:0.00}  {name} (tpl {template.Width}x{template.Height})");
        }
        catch (Exception ex)
        {
            AppendLog($"DIAG: {relativePath} — ERROR: {ex.Message}");
        }
    }

    private List<string> FindMissingTemplates(ActivityDefinition activity)
    {
        var templatesDir = Path.Combine(AppContext.BaseDirectory, "Templates");
        var missing = new List<string>();

        foreach (var action in activity.Actions)
        {
            if (!File.Exists(Path.Combine(templatesDir, action.TemplatePath)))
            {
                missing.Add(action.TemplatePath);
            }
        }

        if (activity.EntryIcon != null && !File.Exists(Path.Combine(templatesDir, activity.EntryIcon)))
        {
            missing.Add(activity.EntryIcon);
        }

        return missing;
    }

    private void AppendLog(string msg)
    {
        var line = $"[{DateTime.Now:HH:mm:ss}] {msg}";
        LogOutput = line + Environment.NewLine + LogOutput;
        Log.Information(msg);
    }

    private static BitmapSource ToBitmapSource(Bitmap bitmap)
    {
        using var ms = new MemoryStream();
        bitmap.Save(ms, ImageFormat.Png);
        ms.Position = 0;
        var img = new BitmapImage();
        img.BeginInit();
        img.StreamSource = ms;
        img.CacheOption  = BitmapCacheOption.OnLoad;
        img.EndInit();
        img.Freeze();
        return img;
    }
}
