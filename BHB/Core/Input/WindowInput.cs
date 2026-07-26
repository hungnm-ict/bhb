using System;
using System.Threading;
using BHB.Core.Win32;

namespace BHB.Core.Input;

public static class WindowInput
{
    /// <summary>
    /// Non-intrusive click via PostMessage. Sends WM_MOUSEMOVE first so Unity's
    /// legacy input system updates its internal cursor position before the button event.
    /// Works for most Unity games; use ClickFocused() if the game uses Raw Input.
    /// </summary>
    public static void Click(IntPtr hwnd, int x, int y, int delayMs = 50)
    {
        var lParam = NativeMethods.MakeLParam(x, y);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_MOUSEMOVE, IntPtr.Zero, lParam);
        Thread.Sleep(10);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_LBUTTONDOWN, (IntPtr)NativeMethods.MK_LBUTTON, lParam);
        Thread.Sleep(delayMs);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_LBUTTONUP, IntPtr.Zero, lParam);
    }

    /// <summary>
    /// Fallback for Unity games that use Raw Input and ignore PostMessage clicks.
    /// Uses SetCursorPos (physical pixels, no DPI math) + SendInput for button events.
    /// Cursor briefly moves to target then snaps back.
    /// </summary>
    public static void ClickFocused(IntPtr hwnd, int clientX, int clientY, int delayMs = 50)
    {
        // Convert client coords → screen physical pixels
        var screenPoint = new POINT { X = clientX, Y = clientY };
        NativeMethods.ClientToScreen(hwnd, ref screenPoint);

        NativeMethods.GetCursorPos(out var savedCursorPosition);
        var previousForegroundWindow = NativeMethods.GetForegroundWindow();

        NativeMethods.SetForegroundWindow(hwnd);
        Thread.Sleep(100);  // wait for window activation

        // Move cursor directly — SetCursorPos takes physical pixels, no normalization needed
        NativeMethods.SetCursorPos(screenPoint.X, screenPoint.Y);
        Thread.Sleep(50);   // let hover register + game frame tick

        SendMouseInput(NativeMethods.MOUSEEVENTF_LEFTDOWN, 0, 0);
        Thread.Sleep(delayMs);
        SendMouseInput(NativeMethods.MOUSEEVENTF_LEFTUP, 0, 0);
        Thread.Sleep(100);  // wait for game to process click before restoring cursor

        NativeMethods.SetCursorPos(savedCursorPosition.X, savedCursorPosition.Y);

        // Hand focus back to whatever the user was working in, otherwise every click
        // permanently steals their foreground window.
        if (previousForegroundWindow != IntPtr.Zero && previousForegroundWindow != hwnd)
        {
            NativeMethods.SetForegroundWindow(previousForegroundWindow);
        }
    }

    /// <summary>
    /// Truly non-intrusive click via Touch Injection. Sends a synthetic touch tap at the
    /// given client coordinates. No cursor movement, no focus change — touch events are
    /// delivered to whichever window occupies those screen coordinates.
    /// Call once at startup: WindowInput.InitTouch()
    /// </summary>
    public static void ClickTouch(IntPtr hwnd, int clientX, int clientY, int delayMs = 50)
    {
        var screenPoint = new POINT { X = clientX, Y = clientY };
        NativeMethods.ClientToScreen(hwnd, ref screenPoint);

        var touchDown = MakeTouchInfo(screenPoint.X, screenPoint.Y,
            NativeMethods.POINTER_FLAG_DOWN |
            NativeMethods.POINTER_FLAG_INRANGE |
            NativeMethods.POINTER_FLAG_INCONTACT |
            NativeMethods.POINTER_FLAG_PRIMARY);

        var touchUp = MakeTouchInfo(screenPoint.X, screenPoint.Y,
            NativeMethods.POINTER_FLAG_UP |
            NativeMethods.POINTER_FLAG_PRIMARY);

        NativeMethods.InjectTouchInput(1, new[] { touchDown });
        Thread.Sleep(delayMs);
        NativeMethods.InjectTouchInput(1, new[] { touchUp });
    }

    public static bool InitTouch()
    {
        return NativeMethods.InitializeTouchInjection(1, NativeMethods.TOUCH_FEEDBACK_NONE);
    }

    private static POINTER_TOUCH_INFO MakeTouchInfo(int screenX, int screenY, uint flags)
    {
        return new POINTER_TOUCH_INFO
        {
            pointerInfo = new POINTER_INFO
            {
                pointerType      = NativeMethods.PT_TOUCH,
                pointerId        = 0,
                pointerFlags     = flags,
                ptPixelLocation  = new POINT { X = screenX, Y = screenY },
                ptHimetricLocation = new POINT { X = screenX, Y = screenY },
            },
            touchFlags = 0,
            touchMask  = 0,
            rcContact  = new RECT { Left = screenX - 2, Top = screenY - 2,
                                    Right = screenX + 2, Bottom = screenY + 2 },
        };
    }

    private static void SendMouseInput(uint flags, int dx, int dy)
    {
        var input = new INPUT
        {
            type = NativeMethods.INPUT_MOUSE,
            mi   = new MOUSEINPUT { dx = dx, dy = dy, dwFlags = flags }
        };
        NativeMethods.SendInput(1, new[] { input }, System.Runtime.InteropServices.Marshal.SizeOf<INPUT>());
    }

    public static void SendKey(IntPtr hwnd, int vkCode, int delayMs = 50)
    {
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_KEYDOWN, (IntPtr)vkCode, IntPtr.Zero);
        Thread.Sleep(delayMs);
        NativeMethods.PostMessage(hwnd, NativeMethods.WM_KEYUP, (IntPtr)vkCode, IntPtr.Zero);
    }

    public static void SendSpace(IntPtr hwnd)
    {
        SendKey(hwnd, NativeMethods.VK_SPACE);
    }

    public static void SendEscape(IntPtr hwnd)
    {
        SendKey(hwnd, NativeMethods.VK_ESCAPE);
    }
}
