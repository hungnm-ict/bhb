using BHB.Common.Controls;
using BHB.ViewModels;
using Microsoft.Extensions.DependencyInjection;

namespace BHB;

public partial class MainWindow : BaseWindow
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = App.Services.GetRequiredService<MainViewModel>();
    }
}
