using System.Threading;
using System.Threading.Tasks;
using BHB.Core.Bot;

namespace BHB.Features.Base;

public interface IFeature
{
    string Name { get; }
    Task<FeatureResult> ExecuteOnceAsync(BotInstance bot, CancellationToken ct);
}

public enum FeatureResult
{
    Continue,
    Rerun,
    OutOfResources,
    Dead,
    Disconnected
}
