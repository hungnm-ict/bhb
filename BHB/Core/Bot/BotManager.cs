using System.Collections.ObjectModel;

namespace BHB.Core.Bot;

public class BotManager
{
    public ObservableCollection<BotInstance> Instances { get; } = new();

    public BotInstance CreateInstance(string accountName)
    {
        var inst = new BotInstance(accountName);
        Instances.Add(inst);
        return inst;
    }

    public void RemoveInstance(string accountName)
    {
        for (int i = Instances.Count - 1; i >= 0; i--)
            if (Instances[i].AccountName == accountName)
                Instances.RemoveAt(i);
    }

    public BotInstance? GetByAccount(string name)
    {
        foreach (var inst in Instances)
            if (inst.AccountName == name) return inst;
        return null;
    }
}
