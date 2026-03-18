using System;
using System.Threading;
using BHB.Core.Win32;

namespace BHB.Core.Input;

public static class WindowInput
{
    public static void Click(IntPtr hwnd, int x, int y, int delayMs = 50)
    {
        var lParam = NativeMethods.MakeLParam(x, y);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_LBUTTONDOWN, (IntPtr)NativeMethods.MK_LBUTTON, lParam);
        Thread.Sleep(delayMs);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_LBUTTONUP, IntPtr.Zero, lParam);
    }

    public static void SendKey(IntPtr hwnd, int vkCode, int delayMs = 50)
    {
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_KEYDOWN, (IntPtr)vkCode, IntPtr.Zero);
        Thread.Sleep(delayMs);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_KEYUP, (IntPtr)vkCode, IntPtr.Zero);
    }

    public static void SendSpace(IntPtr hwnd)  => SendKey(hwnd, NativeMethods.VK_SPACE);
    public static void SendEscape(IntPtr hwnd) => SendKey(hwnd, NativeMethods.VK_ESCAPE);
}
