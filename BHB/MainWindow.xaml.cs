using System.Windows;
using BHB.ViewModels;
using Microsoft.Extensions.DependencyInjection;

namespace BHB;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = App.Services.GetRequiredService<MainViewModel>();
    }
}
