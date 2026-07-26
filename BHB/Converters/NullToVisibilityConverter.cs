using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace BHB.Converters;

/// <summary>
/// Converts null → Visible, non-null → Collapsed.
/// Pass ConverterParameter="Inverse" to flip: non-null → Visible, null → Collapsed.
/// </summary>
public class NullToVisibilityConverter : IValueConverter
{
    private const string InverseParameter = "Inverse";

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        bool isNull = value is null;
        bool isInverse = parameter is string parameterText
            && parameterText.Equals(InverseParameter, StringComparison.OrdinalIgnoreCase);

        if (isNull ^ isInverse)
        {
            return Visibility.Visible;
        }

        return Visibility.Collapsed;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
