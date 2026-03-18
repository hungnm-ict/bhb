using System;
using System.Collections.Generic;
using BHB.Core.Input;
using OpenCvSharp;
using WinPoint = System.Windows.Point;
using CvPoint = OpenCvSharp.Point;

namespace BHB.Core.Vision;

public class TemplateMatcher
{
    private readonly double _threshold;

    public TemplateMatcher(double threshold = 0.85)
    {
        _threshold = threshold;
    }

    public WinPoint? FindTemplate(Mat source, Mat template)
    {
        using var result = new Mat();
        Cv2.MatchTemplate(source, template, result, TemplateMatchModes.CCoeffNormed);
        Cv2.MinMaxLoc(result, out _, out double maxVal, out _, out CvPoint maxLoc);

        if (maxVal < _threshold) return null;

        return new WinPoint(
            maxLoc.X + template.Width  / 2.0,
            maxLoc.Y + template.Height / 2.0);
    }

    public List<WinPoint> FindAllTemplates(Mat source, Mat template)
    {
        var points = new List<WinPoint>();
        using var result = new Mat();
        Cv2.MatchTemplate(source, template, result, TemplateMatchModes.CCoeffNormed);

        while (true)
        {
            Cv2.MinMaxLoc(result, out _, out double maxVal, out _, out CvPoint maxLoc);
            if (maxVal < _threshold) break;

            points.Add(new WinPoint(
                maxLoc.X + template.Width  / 2.0,
                maxLoc.Y + template.Height / 2.0));

            var roi = new Rect(
                Math.Max(0, maxLoc.X - template.Width  / 2),
                Math.Max(0, maxLoc.Y - template.Height / 2),
                Math.Min(template.Width,  result.Width  - Math.Max(0, maxLoc.X - template.Width  / 2)),
                Math.Min(template.Height, result.Height - Math.Max(0, maxLoc.Y - template.Height / 2)));
            result[roi].SetTo(0);
        }

        return points;
    }

    public bool FindAndClick(IntPtr hwnd, Mat source, Mat template)
    {
        var pt = FindTemplate(source, template);
        if (pt == null) return false;
        WindowInput.Click(hwnd, (int)pt.Value.X, (int)pt.Value.Y);
        return true;
    }
}
