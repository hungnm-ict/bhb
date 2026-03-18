using System;
using System.Collections.ObjectModel;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using BHB.Common.ViewModels;
using BHB.Core.Bot;
using BHB.Core.Capture;
using BHB.Core.Win32;
using Serilog;

namespace BHB.ViewModels;

public class MainViewModel : BaseViewModel
{
    private readonly BotManager _botManager;
    private BotInstance? _testInstance;

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

    public ICommand RefreshWindowsCommand { get; }
    public ICommand CaptureTestCommand    { get; }
    public ICommand ClickTestCommand      { get; }
    public ICommand StartCommand          { get; }
    public ICommand StopCommand           { get; }

    public MainViewModel(BotManager botManager)
    {
        _botManager = botManager;

        RefreshWindowsCommand = new RelayCommand(_ => RefreshWindows());
        CaptureTestCommand    = new RelayCommand(_ => CaptureTest(),   _ => SelectedWindow != null);
        ClickTestCommand      = new RelayCommand(_ => ClickTest(),     _ => SelectedWindow != null);
        StartCommand          = new RelayCommand(_ => Start(),         _ => SelectedWindow != null);
        StopCommand           = new RelayCommand(_ => Stop(),          _ => _testInstance  != null);

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
        if (SelectedWindow == null) return;
        var bmp = WindowCapture.Capture(SelectedWindow.Hwnd);
        if (bmp == null) { AppendLog("Capture returned null."); return; }
        LastCapture = ToBitmapSource(bmp);
        bmp.Dispose();
        AppendLog($"Captured: {SelectedWindow.Title} — {(int)SelectedWindow.ClientRect.Width}x{(int)SelectedWindow.ClientRect.Height}");
    }

    private void ClickTest()
    {
        if (SelectedWindow == null) return;
        int cx = (int)(SelectedWindow.ClientRect.Width  / 2);
        int cy = (int)(SelectedWindow.ClientRect.Height / 2);
        Core.Input.WindowInput.Click(SelectedWindow.Hwnd, cx, cy);
        AppendLog($"PostMessage click sent to ({cx},{cy}) — cursor did not move.");
    }

    private void Start()
    {
        if (SelectedWindow == null) return;
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

    private void AppendLog(string msg)
    {
        var line = $"[{DateTime.Now:HH:mm:ss}] {msg}";
        LogOutput = line + Environment.NewLine + LogOutput;
        Log.Information(msg);
    }

    private static BitmapSource ToBitmapSource(Bitmap bmp)
    {
        using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Png);
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
