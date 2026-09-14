using System;
using System.Threading;
using Serilog;

namespace BHB.Core.Input;

/// <summary>
/// Serializes clicks that manipulate globally-shared input state.
/// </summary>
/// <remarks>
/// <see cref="WindowInput.ClickFocused" /> runs SetForegroundWindow → SetCursorPos → SendInput,
/// roughly 250ms during which the foreground window and the cursor belong to one account. With
/// several accounts running concurrently, an interleaved sequence delivers a real mouse click to
/// whichever window happens to be foreground at that instant — that is, to the wrong account's
/// game. Retrying cannot repair it, because the click did not fail; it landed somewhere else.
///
/// Holding this gate for the duration of the click sequence keeps the accounts themselves running
/// in parallel and only queues their clicks. At the default two-second tick, contention across a
/// handful of accounts is negligible.
///
/// Non-intrusive methods (PostMessage, touch injection) target a window handle directly and share
/// no global state, so they bypass the gate entirely.
/// </remarks>
public sealed class ClickCoordinator
{
    /// <summary>
    /// Upper bound on waiting for the gate. A focused click sequence takes about 250ms, so ten
    /// seconds means something is wedged; proceeding unserialized is preferable to stalling a bot
    /// loop forever, and the warning makes the situation visible.
    /// </summary>
    private static readonly TimeSpan AcquireTimeout = TimeSpan.FromSeconds(10);

    private readonly SemaphoreSlim _gate = new(1, 1);

    /// <summary>
    /// Runs <paramref name="click"/> with exclusive access to the cursor and foreground window.
    /// </summary>
    public void RunExclusive(Action click)
    {
        var hasGate = _gate.Wait(AcquireTimeout);
        if (!hasGate)
        {
            Log.Warning("Timed out waiting to serialize a focused click; proceeding unserialized");
        }

        try
        {
            click();
        }
        finally
        {
            if (hasGate)
            {
                _gate.Release();
            }
        }
    }
}
