import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Typography from './Typography';
import Icon from './Icon';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { mediumScale } from '../constants/size';

interface NumberPickerProps {
  value: number | string;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string;
  subtitle?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'body';
  style?: ViewStyle;
}

/**
 * NumberPicker - A reusable number/value picker with left/right arrows
 * 
 * @example
 * <NumberPicker
 *   value={monthlyDay}
 *   onIncrement={() => setMonthlyDay(Math.min(31, monthlyDay + 1))}
 *   onDecrement={() => setMonthlyDay(Math.max(1, monthlyDay - 1))}
 *   subtitle="day of month"
 * />
 */
export default function NumberPicker({ 
  value, 
  onIncrement, 
  onDecrement, 
  label,
  subtitle,
  variant = 'h2',
  style
}: NumberPickerProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onDecrement}
      >
        <Icon name="arrow-left" size={mediumScale(24)} color={Colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.valueContainer}>
        {label && (
          <Typography variant="caption" color={Colors.textLight} style={styles.label}>
            {label}
          </Typography>
        )}
        <Typography variant={variant} color={Colors.primary}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={Colors.textLight}>
            {subtitle}
          </Typography>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={onIncrement}
      >
        <Icon name="arrow-right" size={mediumScale(24)} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  button: {
    padding: Spacing.sm,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    marginBottom: Spacing.xs,
  },
});
