import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { mediumScale } from '../constants/size';

interface DividerProps {
  color?: string;
  thickness?: number;
  spacing?: 'sm' | 'md' | 'lg' | 'none';
  style?: ViewStyle;
}

/**
 * Divider - A simple horizontal divider line
 * 
 * @example
 * <Divider />
 * <Divider color={Colors.primary} thickness={2} spacing="lg" />
 */
export default function Divider({ 
  color = Colors.border,
  thickness = 1,
  spacing = 'md',
  style
}: DividerProps) {
  const spacingMap = {
    none: 0,
    sm: Spacing.sm,
    md: Spacing.md,
    lg: Spacing.lg,
  };

  return (
    <View 
      style={[
        styles.divider,
        { 
          backgroundColor: color,
          height: mediumScale(thickness),
          marginVertical: spacingMap[spacing]
        },
        style
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
