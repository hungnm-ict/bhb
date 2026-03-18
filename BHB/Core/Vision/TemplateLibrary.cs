using System;
using System.Collections.Concurrent;
using System.IO;
using OpenCvSharp;

namespace BHB.Core.Vision;

public class TemplateLibrary
{
    private readonly string _baseDir;
    private readonly ConcurrentDictionary<string, Mat> _cache = new();

    public TemplateLibrary(string baseDir)
    {
        _baseDir = baseDir;
    }

    public Mat Get(string relativePath)
    {
        return _cache.GetOrAdd(relativePath, path =>
        {
            var fullPath = Path.Combine(_baseDir, path);
            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"Template not found: {fullPath}");
            return Cv2.ImRead(fullPath, ImreadModes.Color);
        });
    }

    public void Preload(string folder)
    {
        var dir = Path.Combine(_baseDir, folder);
        if (!Directory.Exists(dir)) return;
        foreach (var file in Directory.GetFiles(dir, "*.png", SearchOption.AllDirectories))
        {
            var rel = Path.GetRelativePath(_baseDir, file);
            Get(rel);
        }
    }

    public void Clear()
    {
        foreach (var mat in _cache.Values) mat.Dispose();
        _cache.Clear();
    }
}
