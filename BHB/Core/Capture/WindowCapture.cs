using System;
using System.Drawing;
using BHB.Core.Win32;
using OpenCvSharp;
using OpenCvSharp.Extensions;

namespace BHB.Core.Capture;

public static class WindowCapture
{
    public static Bitmap? Capture(IntPtr hwnd)
    {
        if (!NativeMethods.GetClientRect(hwnd, out var rect)) return null;

        int width  = rect.Right  - rect.Left;
        int height = rect.Bottom - rect.Top;
        if (width <= 0 || height <= 0) return null;

        IntPtr hdcScreen = NativeMethods.GetDC(hwnd);
        IntPtr hdcMem    = NativeMethods.CreateCompatibleDC(hdcScreen);
        IntPtr hBitmap   = NativeMethods.CreateCompatibleBitmap(hdcScreen, width, height);
        IntPtr hOld      = NativeMethods.SelectObject(hdcMem, hBitmap);

        NativeMethods.PrintWindow(hwnd, hdcMem, NativeMethods.PW_RENDERFULLCONTENT);

        var bmp = Image.FromHbitmap(hBitmap);

        NativeMethods.SelectObject(hdcMem, hOld);
        NativeMethods.DeleteObject(hBitmap);
        NativeMethods.DeleteDC(hdcMem);
        NativeMethods.ReleaseDC(hwnd, hdcScreen);

        return bmp;
    }

    public static Mat? CaptureAsMat(IntPtr hwnd)
    {
        var bmp = Capture(hwnd);
        if (bmp == null) return null;
        var mat = BitmapConverter.ToMat(bmp);
        bmp.Dispose();
        return mat;
    }

    public static Mat BitmapToMat(Bitmap bmp) => BitmapConverter.ToMat(bmp);
}
