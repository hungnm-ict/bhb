using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace BHB.Converters;

/// <summary>false → Visible, true → Collapsed. The complement of WPF's built-in converter.</summary>
public class InverseBooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool flag && flag)
        {
            return Visibility.Collapsed;
        }

        return Visibility.Visible;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
