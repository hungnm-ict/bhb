using OpenCvSharp;

namespace BHB.Features;

/// <summary>Supplies frames for the runner to inspect. Abstracted for testing.</summary>
public interface IFrameSource
{
    /// <summary>Captures the current frame as a 3-channel BGR <see cref="Mat"/>, or null if unavailable.</summary>
    Mat? Capture();
}
