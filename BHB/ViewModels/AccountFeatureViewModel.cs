using System;
using System.Windows.Input;
using BHB.Common.ViewModels;

namespace BHB.ViewModels;

/// <summary>
/// One selectable game mode inside an account's detail pane.
/// </summary>
/// <remarks>
/// Each account owns its own instances rather than sharing a single list, because
/// <see cref="IsSelected" /> is per-account — that is the whole point of the redesign: three
/// accounts each pointing at a different activity.
/// </remarks>
public class AccountFeatureViewModel : BaseViewModel
{
    private readonly Action<AccountFeatureViewModel> _select;

    public AccountFeatureViewModel(PlannedFeature feature, Action<AccountFeatureViewModel> select)
    {
        Name = feature.Name;
        Description = feature.Description;
        Icon = feature.Icon;
        IconBackground = feature.IconBackground;
        IsAvailable = feature.IsAvailable;
        _select = select;

        SelectCommand = new RelayCommand(_ => _select(this), _ => IsAvailable);
    }

    public string Name { get; }

    public string Description { get; }

    public string Icon { get; }

    public string IconBackground { get; }

    /// <summary>False for game modes with no activity definition and no captured templates.</summary>
    public bool IsAvailable { get; }

    public ICommand SelectCommand { get; }

    private bool _isSelected;
    public bool IsSelected
    {
        get
        {
            return _isSelected;
        }
        set
        {
            SetProperty(ref _isSelected, value);
        }
    }
}
