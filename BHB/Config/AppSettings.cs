using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using BHB.Common.Extensions;
using BHB.Common.Shared;
using Serilog;

namespace BHB.Config;

/// <summary>
/// Global app settings, persisted to <c>%AppData%\BHB\settings.json</c>.
/// Replaces Honsen's Newtonsoft-based PnS/Helpers/AppSettings.cs.
/// </summary>
public class AppSettings
{
    private const string SETTINGS_FILE_NAME = "settings.json";

    private static readonly Lazy<AppSettings> _instance = new(Load);
    private static readonly JsonSerializerOptions _serializerOptions = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static AppSettings Instance
    {
        get
        {
            return _instance.Value;
        }
    }

    /// <summary><see cref="System.Windows.Forms.Screen.DeviceName" /> of the monitor last used.</summary>
    [JsonPropertyName("last_screen_device_name")]
    public string LastScreenDeviceName { get; set; } = string.Empty;

    [JsonPropertyName("last_window_maximized")]
    public bool IsLastWindowMaximized { get; set; }

    public static string SettingsPath
    {
        get
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                AppConstants.APP_NAME,
                SETTINGS_FILE_NAME);
        }
    }

    private static AppSettings Load()
    {
        try
        {
            var settingsPath = SettingsPath;
            if (!File.Exists(settingsPath))
            {
                return new AppSettings();
            }

            var json = File.ReadAllText(settingsPath);
            return JsonSerializer.Deserialize<AppSettings>(json, _serializerOptions) ?? new AppSettings();
        }
        catch (Exception exception)
        {
            // A corrupt or unreadable settings file must never stop the app from starting.
            Log.Error(exception, "Cannot load settings, falling back to defaults");
            return new AppSettings();
        }
    }

    public void Save()
    {
        try
        {
            var settingsPath = SettingsPath;
            var settingsDirectory = Path.GetDirectoryName(settingsPath);

            if (settingsDirectory.IsNotNullOrWhiteSpace())
            {
                Directory.CreateDirectory(settingsDirectory);
            }

            File.WriteAllText(settingsPath, JsonSerializer.Serialize(this, _serializerOptions));
        }
        catch (Exception exception)
        {
            Log.Error(exception, "Cannot save settings");
        }
    }
}
