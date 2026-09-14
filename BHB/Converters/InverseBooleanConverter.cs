using System;
using System.Globalization;
using System.Windows.Data;

namespace BHB.Converters;

/// <summary>
/// Negates a bool. Used to bind the two mutually exclusive run-mode radio buttons to the single
/// <c>IsCountMode</c> property rather than introducing a second, desynchronisable flag.
/// </summary>
public class InverseBooleanConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return !ToBoolean(value);
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return !ToBoolean(value);
    }

    private static bool ToBoolean(object? value)
    {
        if (value is bool flag)
        {
            return flag;
        }

        return false;
    }
}
