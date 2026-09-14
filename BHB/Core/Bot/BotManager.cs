using System.Collections.ObjectModel;
using BHB.Core.Input;

namespace BHB.Core.Bot;

public class BotManager
{
    private readonly ClickCoordinator _clickCoordinator;

    public BotManager(ClickCoordinator clickCoordinator)
    {
        _clickCoordinator = clickCoordinator;
    }

    public ObservableCollection<BotInstance> Instances { get; } = new();

    public BotInstance CreateInstance(string accountName)
    {
        var instance = new BotInstance(accountName, _clickCoordinator);
        Instances.Add(instance);

        return instance;
    }

    public void RemoveInstance(string accountName)
    {
        for (int index = Instances.Count - 1; index >= 0; index--)
        {
            if (Instances[index].AccountName == accountName)
            {
                Instances.RemoveAt(index);
            }
        }
    }

    public BotInstance? GetByAccount(string accountName)
    {
        foreach (var instance in Instances)
        {
            if (instance.AccountName == accountName)
            {
                return instance;
            }
        }

        return null;
    }
}
