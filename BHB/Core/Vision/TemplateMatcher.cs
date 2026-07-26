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

    // Scale factors tried when matching, so templates captured at one game-window
    // size still match when the window (and thus the UI) is a different size.
    private static readonly double[] ScaleSteps =
    {
        0.50, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95,
        1.00, 1.05, 1.10, 1.20, 1.30
    };

    public readonly record struct MatchResult(WinPoint Point, double Score, double Scale);

    /// <summary>
    /// The scale that last produced an over-threshold match. The game window does not resize
    /// mid-run, so the winning scale is nearly always the same one as last tick — trying it
    /// first lets <see cref="FindTemplate" /> exit after a single MatchTemplate pass instead of
    /// sweeping all <see cref="ScaleSteps" />. A stale value only costs one wasted pass, so the
    /// benign race between bot instances sharing this matcher does not need locking.
    /// </summary>
    private double _lastMatchedScale = 1.0;

    /// <summary>
    /// Scores <paramref name="template"/> against <paramref name="source"/> at every scale step
    /// and returns the highest, ignoring the threshold. Returns null only when the template fits
    /// the source at no scale at all — a poor match still returns a result, including a negative
    /// score, since CCoeffNormed is valid over -1..1. Sweeps every scale, so this is the
    /// diagnostic path; the runner uses <see cref="FindTemplate" />.
    /// </summary>
    public MatchResult? FindBest(Mat source, Mat template)
    {
        var hasEvaluatedAnyScale = false;
        double bestScore = double.NegativeInfinity;
        WinPoint bestPoint = default;
        double bestScale = 1.0;

        foreach (var scale in ScaleSteps)
        {
            if (!TryMatchAtScale(source, template, scale, out var score, out var point))
            {
                continue;
            }

            hasEvaluatedAnyScale = true;

            if (score > bestScore)
            {
                bestScore = score;
                bestPoint = point;
                bestScale = scale;
            }
        }

        if (!hasEvaluatedAnyScale)
        {
            return null;
        }

        return new MatchResult(bestPoint, bestScore, bestScale);
    }

    /// <summary>
    /// Returns the first over-threshold match, trying the last known-good scale first and then
    /// the remaining steps. Unlike <see cref="FindBest" /> this stops at the first acceptable
    /// scale rather than sweeping all of them — the runner calls it for every template on every
    /// tick, so a full sweep per template would dominate the loop.
    /// </summary>
    public WinPoint? FindTemplate(Mat source, Mat template)
    {
        if (TryMatchAtScale(source, template, _lastMatchedScale, out var cachedScore, out var cachedPoint)
            && cachedScore >= _threshold)
        {
            return cachedPoint;
        }

        foreach (var scale in ScaleSteps)
        {
            if (scale == _lastMatchedScale)
            {
                continue;
            }

            if (TryMatchAtScale(source, template, scale, out var score, out var point) && score >= _threshold)
            {
                _lastMatchedScale = scale;
                return point;
            }
        }

        return null;
    }

    /// <summary>
    /// Runs one MatchTemplate pass at <paramref name="scale"/>. Returns false when the scaled
    /// template does not fit inside the source, in which case no pass was run.
    /// </summary>
    private static bool TryMatchAtScale(Mat source, Mat template, double scale, out double score, out WinPoint point)
    {
        score = double.NegativeInfinity;
        point = default;

        int width  = (int)Math.Round(template.Width  * scale);
        int height = (int)Math.Round(template.Height * scale);
        if (width < 4 || height < 4 || width > source.Width || height > source.Height)
        {
            return false;
        }

        using var scaled = new Mat();
        Cv2.Resize(template, scaled, new Size(width, height));

        using var result = new Mat();
        Cv2.MatchTemplate(source, scaled, result, TemplateMatchModes.CCoeffNormed);
        Cv2.MinMaxLoc(result, out _, out double maxVal, out _, out CvPoint maxLoc);

        score = maxVal;
        point = new WinPoint(maxLoc.X + width / 2.0, maxLoc.Y + height / 2.0);
        return true;
    }

    public List<WinPoint> FindAllTemplates(Mat source, Mat template)
    {
        var points = new List<WinPoint>();
        using var result = new Mat();
        Cv2.MatchTemplate(source, template, result, TemplateMatchModes.CCoeffNormed);

        while (true)
        {
            Cv2.MinMaxLoc(result, out _, out double maxVal, out _, out CvPoint maxLoc);
            if (maxVal < _threshold)
            {
                break;
            }

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

    /// <summary>Diagnostic: best normalized match score (0–1) across all scales, no threshold.</summary>
    public double BestScore(Mat source, Mat template)
    {
        return FindBest(source, template)?.Score ?? 0;
    }

    public bool FindAndClick(IntPtr hwnd, Mat source, Mat template)
    {
        var point = FindTemplate(source, template);
        if (point == null)
        {
            return false;
        }

        WindowInput.Click(hwnd, (int)point.Value.X, (int)point.Value.Y);
        return true;
    }
}
