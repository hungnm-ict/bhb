using System;
using BHB.Core.Capture;
using BHB.Core.Input;
using BHB.Core.Win32;
using OpenCvSharp;

namespace BHB.Features;

/// <summary>
/// How clicks reach the game window. Only <see cref="Focused" /> is confirmed to work with
/// Bit Heroes so far, which is why it is the default despite being intrusive.
/// </summary>
public enum ClickMethod
{
    /// <summary>
    /// PostMessage(WM_LBUTTONDOWN/UP). Fully non-intrusive — no cursor movement, no focus
    /// change. Ignored by Unity builds that read Raw Input, which is the open question here.
    /// </summary>
    PostMessage,

    /// <summary>
    /// Touch injection. Non-intrusive, but delivers to whichever window owns those screen
    /// coordinates, so the game window must not be occluded.
    /// </summary>
    Touch,

    /// <summary>
    /// SetForegroundWindow + SetCursorPos + SendInput. Intrusive: moves the real cursor and
    /// takes focus (both are restored afterwards). Safe to run on several accounts at once only
    /// because <see cref="Core.Input.ClickCoordinator" /> serializes the sequence — but the
    /// cursor still moves, so the machine remains unusable while bots run. A stepping stone,
    /// not the destination.
    /// </summary>
    Focused
}

/// <summary>Production input sink. See <see cref="ClickMethod" /> for the intrusiveness trade-off.</summary>
public sealed class WindowInputSink : IInputSink
{
    private readonly IntPtr _hwnd;
    private readonly ClickMethod _clickMethod;
    private readonly ClickCoordinator _clickCoordinator;

    /// <summary>
    /// Defaults to <see cref="ClickMethod.Focused" /> because it is the only method confirmed to
    /// register with the game. CLAUDE.md's non-intrusive goal needs PostMessage or Touch to work
    /// first — until then the cursor moves while bots run.
    /// </summary>
    public WindowInputSink(IntPtr hwnd, ClickCoordinator clickCoordinator, ClickMethod clickMethod = ClickMethod.Focused)
    {
        _hwnd = hwnd;
        _clickCoordinator = clickCoordinator;
        _clickMethod = clickMethod;
    }

    public void Click(int x, int y)
    {
        // Matched points come from a PrintWindow frame whose origin is the WINDOW
        // top-left (the capture includes the title bar/border). Input APIs expect
        // CLIENT coordinates, so subtract the chrome offset before clicking.
        var (clientX, clientY) = FrameToClient(x, y);

        switch (_clickMethod)
        {
            case ClickMethod.PostMessage:
                // Targets the window handle directly; no shared state, so no gate needed.
                WindowInput.Click(_hwnd, clientX, clientY);
                break;
            case ClickMethod.Touch:
                WindowInput.ClickTouch(_hwnd, clientX, clientY);
                break;
            default:
                // Owns the cursor and foreground window for the duration — must not interleave
                // with another account's click or it lands in the wrong game.
                _clickCoordinator.RunExclusive(() => WindowInput.ClickFocused(_hwnd, clientX, clientY));
                break;
        }
    }

    private (int x, int y) FrameToClient(int frameX, int frameY)
    {
        if (!NativeMethods.GetWindowRect(_hwnd, out var windowRect))
        {
            return (frameX, frameY);
        }

        var clientOrigin = new POINT { X = 0, Y = 0 };
        if (!NativeMethods.ClientToScreen(_hwnd, ref clientOrigin))
        {
            return (frameX, frameY);
        }

        int offsetX = clientOrigin.X - windowRect.Left;
        int offsetY = clientOrigin.Y - windowRect.Top;
        return (frameX - offsetX, frameY - offsetY);
    }

    public void SendSpace()
    {
        WindowInput.SendSpace(_hwnd);
    }

    public void SendEscape()
    {
        WindowInput.SendEscape(_hwnd);
    }
}
