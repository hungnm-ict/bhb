using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Windows;
using Serilog;

namespace BHB.Core.Win32;

public record GameWindowInfo(IntPtr Hwnd, string Title, Rect ClientRect);

public static class WindowFinder
{
    private const int TextBufferLength = 256;

    private const string GameWindowClass        = "UnityWndClass";
    private const string GameWindowTitleKeyword = "Bit Heroes";
    private const string GameProcessName        = "Bit Heroes";   // Process.ProcessName (no .exe)

    public static List<GameWindowInfo> FindAll()
    {
        var results = new List<GameWindowInfo>();

        NativeMethods.EnumWindows((hWnd, _) =>
        {
            if (!NativeMethods.IsWindowVisible(hWnd))
            {
                return true;
            }

            var className = GetWindowClassName(hWnd);
            var title = GetWindowTitle(hWnd);

            // Primary: class + title (native Steam launch).
            var isMatch = className == GameWindowClass
                && title.Contains(GameWindowTitleKeyword, StringComparison.OrdinalIgnoreCase);

            // Fallback: process name, since Sandboxie-wrapped instances may report a
            // different class or title.
            if (!isMatch)
            {
                isMatch = IsGameProcess(hWnd);
            }

            if (!isMatch)
            {
                return true;
            }

            NativeMethods.GetClientRect(hWnd, out var clientRect);
            if (clientRect.Right <= 0 || clientRect.Bottom <= 0)
            {
                // Zero-size windows are hidden helper windows, not a playable client.
                return true;
            }

            results.Add(new GameWindowInfo(hWnd, title, ToRect(clientRect)));
            return true;
        }, IntPtr.Zero);

        return results;
    }

    public static GameWindowInfo? FindByHwnd(IntPtr hwnd)
    {
        GameWindowInfo? found = null;

        NativeMethods.EnumWindows((hWnd, _) =>
        {
            if (hWnd != hwnd)
            {
                return true;
            }

            NativeMethods.GetClientRect(hWnd, out var clientRect);
            found = new GameWindowInfo(hWnd, GetWindowTitle(hWnd), ToRect(clientRect));
            return false;
        }, IntPtr.Zero);

        return found;
    }

    /// <summary>
    /// True when the window belongs to a process named <see cref="GameProcessName" />.
    /// </summary>
    /// <remarks>
    /// Runs for every visible window that failed the class/title check, so it must stay cheap and
    /// must never throw out of the enumeration callback: the owning process can exit between
    /// EnumWindows handing us the handle and the lookup, and protected processes deny access.
    /// Either case just means "not the game".
    /// </remarks>
    private static bool IsGameProcess(IntPtr hWnd)
    {
        NativeMethods.GetWindowThreadProcessId(hWnd, out uint processId);
        if (processId == 0)
        {
            return false;
        }

        try
        {
            using var process = Process.GetProcessById((int)processId);
            return process.ProcessName.Equals(GameProcessName, StringComparison.OrdinalIgnoreCase);
        }
        catch (ArgumentException)
        {
            // Process already exited between enumeration and lookup.
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
        catch (System.ComponentModel.Win32Exception exception)
        {
            Log.Debug(exception, "Cannot inspect process {ProcessId} while scanning windows", processId);
            return false;
        }
    }

    private static string GetWindowClassName(IntPtr hWnd)
    {
        var buffer = new StringBuilder(TextBufferLength);
        NativeMethods.GetClassName(hWnd, buffer, TextBufferLength);

        return buffer.ToString();
    }

    private static string GetWindowTitle(IntPtr hWnd)
    {
        var buffer = new StringBuilder(TextBufferLength);
        NativeMethods.GetWindowText(hWnd, buffer, TextBufferLength);

        return buffer.ToString();
    }

    private static Rect ToRect(RECT rect)
    {
        return new Rect(rect.Left, rect.Top, rect.Right - rect.Left, rect.Bottom - rect.Top);
    }
}
