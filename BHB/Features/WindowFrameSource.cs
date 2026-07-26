using System;
using BHB.Core.Capture;
using BHB.Core.Input;
using BHB.Core.Win32;
using OpenCvSharp;

namespace BHB.Features;

/// <summary>Production frame source: PrintWindow capture normalized to 3-channel BGR.</summary>
public sealed class WindowFrameSource : IFrameSource
{
    private readonly IntPtr _hwnd;

    public WindowFrameSource(IntPtr hwnd)
    {
        _hwnd = hwnd;
    }

    public Mat? Capture()
    {
        var mat = WindowCapture.CaptureAsMat(_hwnd);
        if (mat == null)
        {
            return null;
        }

        // Templates are loaded as 3-channel BGR; PrintWindow frames are often BGRA.
        // MatchTemplate requires matching channel counts, so normalize here.
        if (mat.Channels() == 4)
        {
            var bgr = new Mat();
            Cv2.CvtColor(mat, bgr, ColorConversionCodes.BGRA2BGR);
            mat.Dispose();
            return bgr;
        }

        return mat;
    }
}
