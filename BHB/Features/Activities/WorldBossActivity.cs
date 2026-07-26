using System.Collections.Generic;

namespace BHB.Features.Activities;

/// <summary>
/// World Boss (solo, default settings). Uses whatever boss / tier / difficulty the
/// player configured in-game — it just consumes turns. The flow, derived from the
/// captured screens: enter via the sidebar BOSS icon, Summon through the boss →
/// party → tier/difficulty screens, Start the fight, then Regroup after win or loss
/// (each Regroup = one completed run). Stops when Xeals run out.
/// </summary>
public static class WorldBossActivity
{
    public static ActivityDefinition Create()
    {
        return new ActivityDefinition
        {
            Name = "World Boss",
            EntryIcon = "WorldBoss/EntryIcon.png",
            LoopIntervalMs = 2000,
            Actions = new List<ReactiveAction>
            {
                // Dialogs first (keyed on unique text, answered by keypress — never
                // clicking a shared YES/NO button).
                new("WorldBoss/NotEnoughXeals.png", ActionResponse.SendEscape, IsOutOfResources: true),
                new("Global/ConfirmStartNotFullTeam.png", ActionResponse.SendSpace),

                // End-of-fight screens — one completed run each (victory or defeat).
                new("WorldBoss/Regroup.png", ActionResponse.Click, CountsAsRun: true),
                new("WorldBoss/RegroupDefeated.png", ActionResponse.Click, CountsAsRun: true),

                // Forward flow: boss carousel → party listing → tier/difficulty → start.
                new("WorldBoss/SummonBoss.png"),
                new("WorldBoss/SummonParty.png"),
                new("WorldBoss/SummonTierDifficulty.png"),
                new("WorldBoss/StartBoss.png"),
            },
        };
    }
}
