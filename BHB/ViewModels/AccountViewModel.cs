using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using BHB.Common.ViewModels;
using BHB.Core.Bot;
using BHB.Core.Vision;
using BHB.Core.Win32;
using BHB.Features;
using BHB.Features.Activities;

namespace BHB.ViewModels;

/// <summary>
/// One configured account: which game window it drives, which activity it runs, and its own
/// runner, state, progress and log. Everything here used to be singular on MainViewModel, which
/// is why three accounts running three different activities was not expressible.
/// </summary>
public class AccountViewModel : BaseViewModel
{
    /// <summary>Newest entries first; trimmed so a long run cannot grow the UI without bound.</summary>
    private const int MaxLogEntries = 500;

    private readonly BotManager _botManager;
    private readonly TemplateLibrary _templates;

    /// <summary>
    /// This account's own matcher. TemplateMatcher caches the last scale that matched, and that
    /// cache assumes one window size — sharing a single matcher across accounts whose windows
    /// differ in size would make them fight over it. TemplateLibrary stays shared: it is a
    /// read-only cache of decoded images.
    /// </summary>
    private readonly TemplateMatcher _matcher = new();

    private BotInstance? _instance;
    private bool _isRunning;

    public AccountViewModel(
        string name,
        BotManager botManager,
        TemplateLibrary templates,
        ObservableCollection<GameWindowInfo> availableWindows)
    {
        Name = name;
        _botManager = botManager;
        _templates = templates;
        AvailableWindows = availableWindows;

        // Each account gets its own card instances — selection is per-account.
        foreach (var feature in PlannedFeatures.All)
        {
            Features.Add(new AccountFeatureViewModel(feature, SelectFeature));
        }

        _selectedActivity = ActivityCatalog.DefaultName;
        SelectFeature(FindFeature(_selectedActivity));

        StartCommand = new RelayCommand(_ => _ = StartAsync(), _ => CanStart);
        StopCommand = new RelayCommand(_ => Stop(), _ => IsRunning);
    }

    public string Name { get; }

    /// <summary>Shared with every account — the windows detected on the machine.</summary>
    public ObservableCollection<GameWindowInfo> AvailableWindows { get; }

    /// <summary>
    /// The game modes, as selectable cards. Replaces the activity dropdown: picking what an
    /// account runs is per-account, so the list belongs here rather than on a global page.
    /// </summary>
    public ObservableCollection<AccountFeatureViewModel> Features { get; } = new();

    public ObservableCollection<string> Log { get; } = new();

    public ICommand StartCommand { get; }

    public ICommand StopCommand { get; }

    private GameWindowInfo? _selectedWindow;
    public GameWindowInfo? SelectedWindow
    {
        get
        {
            return _selectedWindow;
        }
        set
        {
            if (SetProperty(ref _selectedWindow, value))
            {
                OnPropertyChanged(nameof(CanStart));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    /// <summary>
    /// Name of the activity this account runs. Driven by the feature cards, so it is read-only
    /// from the view's perspective — there is exactly one way to change it.
    /// </summary>
    private string _selectedActivity;
    public string SelectedActivity
    {
        get
        {
            return _selectedActivity;
        }
        private set
        {
            SetProperty(ref _selectedActivity, value);
        }
    }

    /// <summary>
    /// Makes <paramref name="feature"/> the account's activity. Unavailable cards are ignored;
    /// their command is already disabled, this guards the programmatic path.
    /// </summary>
    private void SelectFeature(AccountFeatureViewModel? feature)
    {
        if (feature == null || !feature.IsAvailable)
        {
            return;
        }

        foreach (var candidate in Features)
        {
            candidate.IsSelected = ReferenceEquals(candidate, feature);
        }

        SelectedActivity = feature.Name;
        OnPropertyChanged(nameof(ListSummary));
    }

    private AccountFeatureViewModel? FindFeature(string name)
    {
        foreach (var feature in Features)
        {
            if (string.Equals(feature.Name, name, StringComparison.OrdinalIgnoreCase))
            {
                return feature;
            }
        }

        return null;
    }

    private bool _isCountMode = true;
    public bool IsCountMode
    {
        get
        {
            return _isCountMode;
        }
        set
        {
            SetProperty(ref _isCountMode, value);
        }
    }

    private int _runCount = 10;
    public int RunCount
    {
        get
        {
            return _runCount;
        }
        set
        {
            SetProperty(ref _runCount, value);
        }
    }

    /// <summary>Drives the status dot in the account list.</summary>
    private BotState _state = BotState.Idle;
    public BotState State
    {
        get
        {
            return _state;
        }
        private set
        {
            SetProperty(ref _state, value);
        }
    }

    private int _runsCompleted;
    public int RunsCompleted
    {
        get
        {
            return _runsCompleted;
        }
        private set
        {
            SetProperty(ref _runsCompleted, value);
        }
    }

    /// <summary>Human-readable progress line, e.g. "Runs 7/20 — Regroup".</summary>
    private string _runStatus = "Idle";
    public string RunStatus
    {
        get
        {
            return _runStatus;
        }
        private set
        {
            SetProperty(ref _runStatus, value);
        }
    }

    public bool IsRunning
    {
        get
        {
            return _isRunning;
        }
        private set
        {
            if (SetProperty(ref _isRunning, value))
            {
                OnPropertyChanged(nameof(CanStart));
                CommandManager.InvalidateRequerySuggested();
            }
        }
    }

    public bool CanStart
    {
        get
        {
            return SelectedWindow != null && !IsRunning;
        }
    }

    /// <summary>One-line summary for the account list row.</summary>
    public string ListSummary
    {
        get
        {
            return $"{SelectedActivity} — {RunStatus}";
        }
    }

    private async Task StartAsync()
    {
        if (!CanStart)
        {
            return;
        }

        var activity = ActivityCatalog.Create(SelectedActivity);
        if (activity == null)
        {
            AppendLog($"Unknown activity '{SelectedActivity}'.");
            return;
        }

        var missingTemplates = FindMissingTemplates(activity);
        if (missingTemplates.Count > 0)
        {
            AppendLog($"Cannot start — missing templates: {string.Join(", ", missingTemplates)}");
            RunStatus = "Missing templates";
            return;
        }

        IsRunning = true;
        RunsCompleted = 0;

        _instance = _botManager.CreateInstance(Name);
        _instance.Hwnd = SelectedWindow!.Hwnd;
        _instance.State.StateChanged += OnBotStateChanged;

        var mode = IsCountMode ? RunMode.Count : RunMode.UntilOutOfResources;
        var target = IsCountMode ? Math.Max(1, RunCount) : 0;

        // Constructed on the UI thread, so both callbacks marshal back to it — the bound
        // collections are then only ever touched from the dispatcher.
        var progress = new Progress<ActivityProgress>(OnProgress);
        var runLog = new Progress<string>(AppendLog);

        AppendLog($"Starting {activity.Name} — {(IsCountMode ? $"{target} runs" : "until out of resources")}");
        RunStatus = "Running…";

        try
        {
            var reason = await Task.Run(() =>
                _instance.RunActivityAsync(activity, mode, target, _templates, _matcher, progress, runLog));

            AppendLog($"{activity.Name} finished: {reason}");
            RunStatus = $"Stopped: {reason}";
        }
        catch (Exception exception)
        {
            Serilog.Log.Error(exception, "Activity failed for {Account}", Name);
            AppendLog($"Activity error: {exception.Message}");
            RunStatus = "Error";
        }
        finally
        {
            if (_instance != null)
            {
                _instance.State.StateChanged -= OnBotStateChanged;
            }

            _botManager.RemoveInstance(Name);
            _instance = null;
            IsRunning = false;
            OnPropertyChanged(nameof(ListSummary));
        }
    }

    private void Stop()
    {
        _instance?.Stop();
        AppendLog("Stop requested.");
    }

    private void OnBotStateChanged(BotState previousState, BotState nextState)
    {
        // Raised from the runner's background thread.
        Application.Current.Dispatcher.Invoke(() =>
        {
            State = nextState;
            OnPropertyChanged(nameof(ListSummary));
        });
    }

    private void OnProgress(ActivityProgress progress)
    {
        RunsCompleted = progress.RunsCompleted;

        var goal = progress.TargetRuns.HasValue ? progress.TargetRuns.Value.ToString() : "∞";
        RunStatus = $"Runs {progress.RunsCompleted}/{goal} — {progress.CurrentStep}";
        OnPropertyChanged(nameof(ListSummary));
    }

    private void AppendLog(string message)
    {
        Log.Insert(0, $"[{DateTime.Now:HH:mm:ss}] {message}");

        while (Log.Count > MaxLogEntries)
        {
            Log.RemoveAt(Log.Count - 1);
        }

        Serilog.Log.ForContext("Account", Name).Information(message);
    }

    private static List<string> FindMissingTemplates(ActivityDefinition activity)
    {
        var templatesDirectory = Path.Combine(AppContext.BaseDirectory, "Templates");
        var missing = new List<string>();

        foreach (var action in activity.Actions)
        {
            if (!File.Exists(Path.Combine(templatesDirectory, action.TemplatePath)))
            {
                missing.Add(action.TemplatePath);
            }
        }

        if (activity.EntryIcon != null && !File.Exists(Path.Combine(templatesDirectory, activity.EntryIcon)))
        {
            missing.Add(activity.EntryIcon);
        }

        return missing;
    }
}
