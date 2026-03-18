using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;

namespace BHB.Core.Win32;

public record GameWindowInfo(IntPtr Hwnd, string Title, Rect ClientRect);

public static class WindowFinder
{
    private const string GameWindowClass = "UnityWndClass";
    private const string GameWindowTitleKeyword = "Bit Heroes";

    public static List<GameWindowInfo> FindAll()
    {
        var results = new List<GameWindowInfo>();
        NativeMethods.EnumWindows((hWnd, _) =>
        {
            if (!NativeMethods.IsWindowVisible(hWnd)) return true;

            var sb = new StringBuilder(256);
            NativeMethods.GetClassName(hWnd, sb, 256);
            if (sb.ToString() != GameWindowClass) return true;

            var title = new StringBuilder(256);
            NativeMethods.GetWindowText(hWnd, title, 256);
            if (!title.ToString().Contains(GameWindowTitleKeyword, StringComparison.OrdinalIgnoreCase))
                return true;

            NativeMethods.GetClientRect(hWnd, out var cr);
            results.Add(new GameWindowInfo(
                hWnd,
                title.ToString(),
                new Rect(cr.Left, cr.Top, cr.Right - cr.Left, cr.Bottom - cr.Top)));
            return true;
        }, IntPtr.Zero);
        return results;
    }

    public static GameWindowInfo? FindByHwnd(IntPtr hwnd)
    {
        GameWindowInfo? found = null;
        NativeMethods.EnumWindows((hWnd, _) =>
        {
            if (hWnd != hwnd) return true;
            var title = new StringBuilder(256);
            NativeMethods.GetWindowText(hWnd, title, 256);
            NativeMethods.GetClientRect(hWnd, out var cr);
            found = new GameWindowInfo(
                hWnd,
                title.ToString(),
                new Rect(cr.Left, cr.Top, cr.Right - cr.Left, cr.Bottom - cr.Top));
            return false;
        }, IntPtr.Zero);
        return found;
    }
}
