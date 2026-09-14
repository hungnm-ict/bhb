using System;
using System.Collections.ObjectModel;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Threading.Tasks;
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

/// <summary>Which page the nav rail is showing.</summary>
public enum ShellPage
{
    Accounts,
    Tools
}

/// <summary>
/// Application shell: the account list, the shared window list, nav state, and the engine-test
/// tools. Per-account configuration and running lives on <see cref="AccountViewModel" />.
/// </summary>
public class MainViewModel : BaseViewModel
{
    private const int MaxToolLogEntries = 500;

    // Quest button on the left sidebar, in client coordinates. Only used by the engine-test
    // tools to compare click methods against a known target.
    private const int QuestButtonX = 27;
    private const int QuestButtonY = 88;

    private readonly BotManager _botManager;
    private readonly TemplateLibrary _templates;
    private readonly TemplateMatcher _toolMatcher = new();
    private readonly ClickCoordinator _clickCoordinator;

    private bool _isDemoRunning;
    private int _accountSequence;

    public MainViewModel(
        BotManager botManager,
        TemplateLibrary templates,
        ClickCoordinator clickCoordinator)
    {
        _botManager = botManager;
        _templates = templates;
        _clickCoordinator = clickCoordinator;

        RefreshWindowsCommand = new RelayCommand(_ => RefreshWindows());
        AddAccountCommand = new RelayCommand(_ => AddAccount());
        RemoveAccountCommand = new RelayCommand(_ => RemoveSelectedAccount(), _ => CanRemoveSelectedAccount);

        ShowAccountsCommand = new RelayCommand(_ => CurrentPage = ShellPage.Accounts);
        ShowToolsCommand = new RelayCommand(_ => CurrentPage = ShellPage.Tools);

        CaptureTestCommand = new RelayCommand(_ => CaptureTest(), _ => HasToolWindow);
        SaveCaptureCommand = new RelayCommand(_ => SaveCapture(), _ => LastCapture != null);
        ClickTestCommand = new RelayCommand(_ => ClickTest(), _ => HasToolWindow);
        DemoQuestCommand = new RelayCommand(_ => _ = DemoQuestAsync(), _ => HasToolWindow && !_isDemoRunning);
        DemoTouchCommand = new RelayCommand(_ => _ = DemoTouchAsync(), _ => HasToolWindow && !_isDemoRunning);
        DiagnoseCommand = new RelayCommand(_ => Diagnose(), _ => HasToolWindow);

        var isTouchAvailable = WindowInput.InitTouch();
        AppendToolLog(isTouchAvailable ? "Touch injection initialised." : "Touch injection unavailable.");

        RefreshWindows();
        AddAccount();
    }

    public ObservableCollection<GameWindowInfo> AvailableWindows { get; } = new();

    public ObservableCollection<AccountViewModel> Accounts { get; } = new();

    /// <summary>Engine-test output. Separate from account logs so tool noise stays out of runs.</summary>
    public ObservableCollection<string> ToolLog { get; } = new();

    public ICommand RefreshWindowsCommand { get; }
    public ICommand AddAccountCommand { get; }
    public ICommand RemoveAccountCommand { get; }
    public ICommand ShowAccountsCommand { get; }
    public ICommand ShowToolsCommand { get; }
    public ICommand CaptureTestCommand { get; }
    public ICommand SaveCaptureCommand { get; }
    public ICommand ClickTestCommand { get; }
    public ICommand DemoQuestCommand { get; }
    public ICommand DemoTouchCommand { get; }
    public ICommand DiagnoseCommand { get; }

    private AccountViewModel? _selectedAccount;
    public AccountViewModel? SelectedAccount
    {
        get
        {
            return _selectedAccount;
        }
        set
        {
            if (SetProperty(ref _selectedAccount, value))
            {
                OnPropertyChanged(nameof(HasSelectedAccount));
                OnPropertyChanged(nameof(HasToolWindow));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool HasSelectedAccount
    {
        get
        {
            return SelectedAccount != null;
        }
    }

    private ShellPage _currentPage = ShellPage.Accounts;
    public ShellPage CurrentPage
    {
        get
        {
            return _currentPage;
        }
        set
        {
            if (SetProperty(ref _currentPage, value))
            {
                OnPropertyChanged(nameof(IsAccountsPage));
                OnPropertyChanged(nameof(IsToolsPage));
            }
        }
    }

    public bool IsAccountsPage
    {
        get
        {
            return CurrentPage == ShellPage.Accounts;
        }
    }

    public bool IsToolsPage
    {
        get
        {
            return CurrentPage == ShellPage.Tools;
        }
    }

    private BitmapSource? _lastCapture;
    public BitmapSource? LastCapture
    {
        get
        {
            return _lastCapture;
        }
        set
        {
            SetProperty(ref _lastCapture, value);
        }
    }

    /// <summary>The tools act on whichever window the selected account is bound to.</summary>
    private bool HasToolWindow
    {
        get
        {
            return SelectedAccount?.SelectedWindow != null;
        }
    }

    private bool CanRemoveSelectedAccount
    {
        get
        {
            return SelectedAccount != null && !SelectedAccount.IsRunning;
        }
    }

    private void RefreshWindows()
    {
        AvailableWindows.Clear();
        foreach (var window in WindowFinder.FindAll())
        {
            AvailableWindows.Add(window);
        }

        AppendToolLog($"Found {AvailableWindows.Count} game window(s).");
    }

    private void AddAccount()
    {
        _accountSequence++;
        var account = new AccountViewModel($"Account {_accountSequence}", _botManager, _templates, AvailableWindows);
        Accounts.Add(account);
        SelectedAccount = account;
    }

    private void RemoveSelectedAccount()
    {
        if (!CanRemoveSelectedAccount)
        {
            return;
        }

        var removed = SelectedAccount!;
        Accounts.Remove(removed);
        SelectedAccount = Accounts.Count > 0 ? Accounts[0] : null;
    }

    private void CaptureTest()
    {
        var window = SelectedAccount?.SelectedWindow;
        if (window == null)
        {
            return;
        }

        var bitmap = WindowCapture.Capture(window.Hwnd);
        if (bitmap == null)
        {
            AppendToolLog("Capture returned null.");
            return;
        }

        LastCapture = ToBitmapSource(bitmap);
        bitmap.Dispose();
        AppendToolLog($"Captured: {window.Title} — {(int)window.ClientRect.Width}x{(int)window.ClientRect.Height}");
        CommandManager.InvalidateRequerySuggested();
    }

    private void SaveCapture()
    {
        if (LastCapture == null)
        {
            AppendToolLog("Nothing to save — run Capture first.");
            return;
        }

        var directory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            AppConstants.APP_NAME, "captures");
        Directory.CreateDirectory(directory);

        var path = Path.Combine(directory, $"capture_{DateTime.Now:yyyyMMdd_HHmmss}.png");
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(LastCapture));
        using (var stream = File.Create(path))
        {
            encoder.Save(stream);
        }

        AppendToolLog($"Saved capture → {path}");
    }

    private void ClickTest()
    {
        var window = SelectedAccount?.SelectedWindow;
        if (window == null)
        {
            return;
        }

        // Same target as the demos so PostMessage and ClickFocused are directly comparable.
        WindowInput.Click(window.Hwnd, QuestButtonX, QuestButtonY);
        AppendToolLog($"PostMessage+WM_MOUSEMOVE click → ({QuestButtonX},{QuestButtonY}) client coords");
    }

    private async Task DemoQuestAsync()
    {
        var window = SelectedAccount?.SelectedWindow;
        if (window == null || _isDemoRunning)
        {
            return;
        }

        _isDemoRunning = true;
        CommandManager.InvalidateRequerySuggested();

        var hwnd = window.Hwnd;
        try
        {
            AppendToolLog($"Demo: clicking Quest btn ({QuestButtonX},{QuestButtonY}) via ClickFocused…");
            await Task.Run(() => _clickCoordinator.RunExclusive(
                () => WindowInput.ClickFocused(hwnd, QuestButtonX, QuestButtonY)));

            AppendToolLog("Demo: waiting 1.5 s then capturing result…");
            await Task.Delay(1500);
            CaptureAfterDemo(hwnd, "Demo");

            await Task.Delay(500);
            AppendToolLog("Demo: pressing Escape to close…");
            await Task.Run(() => WindowInput.SendEscape(hwnd));
        }
        finally
        {
            _isDemoRunning = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private async Task DemoTouchAsync()
    {
        var window = SelectedAccount?.SelectedWindow;
        if (window == null || _isDemoRunning)
        {
            return;
        }

        _isDemoRunning = true;
        CommandManager.InvalidateRequerySuggested();

        var hwnd = window.Hwnd;
        try
        {
            AppendToolLog($"Demo Touch: injecting touch tap at ({QuestButtonX},{QuestButtonY}) — no cursor movement…");
            await Task.Run(() => WindowInput.ClickTouch(hwnd, QuestButtonX, QuestButtonY));

            AppendToolLog("Demo Touch: waiting 1.5 s then capturing result…");
            await Task.Delay(1500);
            CaptureAfterDemo(hwnd, "Demo Touch");

            await Task.Delay(500);
            AppendToolLog("Demo Touch: pressing Escape to close…");
            await Task.Run(() => WindowInput.SendEscape(hwnd));
        }
        finally
        {
            _isDemoRunning = false;
            CommandManager.InvalidateRequerySuggested();
        }
    }

    private void CaptureAfterDemo(IntPtr hwnd, string label)
    {
        var bitmap = WindowCapture.Capture(hwnd);
        if (bitmap == null)
        {
            return;
        }

        LastCapture = ToBitmapSource(bitmap);
        bitmap.Dispose();
        AppendToolLog($"{label}: captured — check preview to see if Quest map opened.");
    }

    /// <summary>
    /// One-shot diagnostic: capture the current frame and report capture health plus the best
    /// match score for every template of the selected account's activity.
    /// </summary>
    private void Diagnose()
    {
        var window = SelectedAccount?.SelectedWindow;
        if (window == null)
        {
            return;
        }

        var frames = new WindowFrameSource(window.Hwnd);
        using var frame = frames.Capture();
        if (frame == null)
        {
            AppendToolLog("DIAG: capture returned NULL — WindowCapture failed for this hwnd.");
            return;
        }

        AppendToolLog($"DIAG: frame {frame.Width}x{frame.Height}, channels={frame.Channels()}, type={frame.Type()}");

        if (NativeMethods.GetWindowRect(window.Hwnd, out var windowRect) &&
            NativeMethods.GetClientRect(window.Hwnd, out var clientRect))
        {
            var origin = new POINT { X = 0, Y = 0 };
            NativeMethods.ClientToScreen(window.Hwnd, ref origin);
            int offsetX = origin.X - windowRect.Left;
            int offsetY = origin.Y - windowRect.Top;
            AppendToolLog($"DIAG: window {windowRect.Right - windowRect.Left}x{windowRect.Bottom - windowRect.Top}, " +
                          $"client {clientRect.Right - clientRect.Left}x{clientRect.Bottom - clientRect.Top}, " +
                          $"chrome offset ({offsetX},{offsetY})");
        }

        var activity = ActivityCatalog.Create(SelectedAccount?.SelectedActivity);
        if (activity == null)
        {
            AppendToolLog("DIAG: selected account has no runnable activity.");
            return;
        }

        var templatesDirectory = Path.Combine(AppContext.BaseDirectory, "Templates");
        foreach (var action in activity.Actions)
        {
            ReportTemplateScore(frame, templatesDirectory, action.TemplatePath);
        }

        if (activity.EntryIcon != null)
        {
            ReportTemplateScore(frame, templatesDirectory, activity.EntryIcon);
        }

        AppendToolLog("DIAG: threshold is 0.85 — any score >= 0.85 would match.");
    }

    private void ReportTemplateScore(OpenCvSharp.Mat frame, string templatesDirectory, string relativePath)
    {
        try
        {
            var fullPath = Path.Combine(templatesDirectory, relativePath);
            if (!File.Exists(fullPath))
            {
                AppendToolLog($"DIAG: {relativePath} — FILE MISSING at {fullPath}");
                return;
            }

            var template = _templates.Get(relativePath);
            var best = _toolMatcher.FindBest(frame, template);
            var name = Path.GetFileNameWithoutExtension(relativePath);
            if (best == null)
            {
                AppendToolLog($"DIAG best=n/a  {name} (template larger than frame)");
                return;
            }

            AppendToolLog($"DIAG best={best.Value.Score:F3} @scale={best.Value.Scale:0.00}  {name} (tpl {template.Width}x{template.Height})");
        }
        catch (Exception exception)
        {
            AppendToolLog($"DIAG: {relativePath} — ERROR: {exception.Message}");
        }
    }

    private void AppendToolLog(string message)
    {
        ToolLog.Insert(0, $"[{DateTime.Now:HH:mm:ss}] {message}");

        while (ToolLog.Count > MaxToolLogEntries)
        {
            ToolLog.RemoveAt(ToolLog.Count - 1);
        }

        Log.Information(message);
    }

    private static BitmapSource ToBitmapSource(Bitmap bitmap)
    {
        using var stream = new MemoryStream();
        bitmap.Save(stream, ImageFormat.Png);
        stream.Position = 0;

        var image = new BitmapImage();
        image.BeginInit();
        image.StreamSource = stream;
        image.CacheOption = BitmapCacheOption.OnLoad;
        image.EndInit();
        image.Freeze();

        return image;
    }
}
