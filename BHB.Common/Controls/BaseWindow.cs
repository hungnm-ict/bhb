using System.Windows;

namespace BHB.Common.Controls;

public class BaseWindow : Window
{
    public BaseWindow()
    {
        SnapsToDevicePixels = true;
        UseLayoutRounding = true;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
    }
}
