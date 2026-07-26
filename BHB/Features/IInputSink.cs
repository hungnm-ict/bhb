namespace BHB.Features;

/// <summary>Delivers input to the game window. Abstracted for testing.</summary>
public interface IInputSink
{
    void Click(int x, int y);
    void SendSpace();
    void SendEscape();
}
