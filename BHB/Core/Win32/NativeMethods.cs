using System;
using System.Runtime.InteropServices;
using System.Text;

namespace BHB.Core.Win32;

internal static class NativeMethods
{
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateCompatibleBitmap(IntPtr hdc, int nWidth, int nHeight);

    [DllImport("gdi32.dll")]
    public static extern IntPtr SelectObject(IntPtr hdc, IntPtr hgdiobj);

    [DllImport("gdi32.dll")]
    public static extern bool DeleteDC(IntPtr hdc);

    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    public const uint WM_MOUSEMOVE   = 0x0200;
    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP   = 0x0202;
    public const uint WM_KEYDOWN     = 0x0100;
    public const uint WM_KEYUP       = 0x0101;
    public const uint PW_RENDERFULLCONTENT = 0x00000002;
    public const int  MK_LBUTTON     = 0x0001;
    public const int  VK_SPACE       = 0x20;
    public const int  VK_ESCAPE      = 0x1B;

    public const uint MOUSEEVENTF_MOVE     = 0x0001;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint MOUSEEVENTF_ABSOLUTE = 0x8000;

    public const uint INPUT_MOUSE = 0;

    // Touch Injection (Windows 8+) — delivers touch to whichever window is at those
    // screen coordinates, no cursor movement, no focus change required.
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool InitializeTouchInjection(uint maxCount, uint dwMode);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool InjectTouchInput(uint count, [In] POINTER_TOUCH_INFO[] contacts);

    public const uint TOUCH_FEEDBACK_NONE = 3;   // no visual ripple indicator
    public const uint PT_TOUCH            = 2;   // POINTER_INPUT_TYPE

    public const uint POINTER_FLAG_INRANGE   = 0x00000002;
    public const uint POINTER_FLAG_INCONTACT = 0x00000004;
    public const uint POINTER_FLAG_PRIMARY   = 0x00002000;
    public const uint POINTER_FLAG_DOWN      = 0x00010000;
    public const uint POINTER_FLAG_UPDATE    = 0x00020000;
    public const uint POINTER_FLAG_UP        = 0x00040000;

    public static IntPtr MakeLParam(int x, int y) => (IntPtr)((y << 16) | (x & 0xFFFF));
}

[StructLayout(LayoutKind.Sequential)]
public struct RECT
{
    public int Left, Top, Right, Bottom;
}

[StructLayout(LayoutKind.Sequential)]
public struct POINT
{
    public int X, Y;
}

[StructLayout(LayoutKind.Sequential)]
public struct MOUSEINPUT
{
    public int     dx;
    public int     dy;
    public uint    mouseData;
    public uint    dwFlags;
    public uint    time;
    public IntPtr  dwExtraInfo;
}

[StructLayout(LayoutKind.Sequential)]
public struct INPUT
{
    public uint       type;
    public MOUSEINPUT mi;
}

[StructLayout(LayoutKind.Sequential)]
public struct POINTER_INFO
{
    public uint   pointerType;           // PT_TOUCH = 2
    public uint   pointerId;
    public uint   frameId;
    public uint   pointerFlags;
    public IntPtr sourceDevice;
    public IntPtr hwndTarget;
    public POINT  ptPixelLocation;
    public POINT  ptHimetricLocation;
    public POINT  ptPixelLocationRaw;
    public POINT  ptHimetricLocationRaw;
    public uint   dwTime;
    public uint   historyCount;
    public int    InputData;
    public uint   dwKeyStates;
    public ulong  PerformanceCount;
    public int    ButtonChangeType;
}

[StructLayout(LayoutKind.Sequential)]
public struct POINTER_TOUCH_INFO
{
    public POINTER_INFO pointerInfo;
    public uint         touchFlags;   // TOUCH_FLAG_NONE = 0
    public uint         touchMask;    // TOUCH_MASK_NONE = 0
    public RECT         rcContact;
    public RECT         rcContactRaw;
    public uint         orientation;
    public uint         pressure;
}
