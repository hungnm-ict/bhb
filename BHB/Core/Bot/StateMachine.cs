using System;

namespace BHB.Core.Bot;

public class StateMachine
{
    public BotState Current { get; private set; } = BotState.Idle;
    public event Action<BotState, BotState>? StateChanged;

    public void Transition(BotState next)
    {
        var prev = Current;
        Current = next;
        StateChanged?.Invoke(prev, next);
    }

    public bool CanTransition(BotState next) => true;

    public void Reset() => Transition(BotState.Idle);
}
