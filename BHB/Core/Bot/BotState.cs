namespace BHB.Core.Bot;

public enum BotState
{
    Idle,
    Starting,
    Running,
    Rerunning,
    OutOfResources,
    Dead,
    Disconnected,
    Reconnecting,
    Stopped
}
