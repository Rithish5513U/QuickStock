import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Typography from './Typography';
import Icon from './Icon';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface ChipButtonProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
}

export default function ChipButton({ label, active = false, onPress, icon, style }: ChipButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && styles.chipActive,
        style
      ]}
      onPress={onPress}
    >
      {icon && <Icon name={icon as any} size={16} color={active ? Colors.white : Colors.primary} />}
      <Typography
        variant="caption"
        color={active ? Colors.white : Colors.textPrimary}
        style={styles.label}
      >
        {label}
      </Typography>
      {active && <Icon name="check" size={16} color={Colors.white} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.background,
    gap: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontWeight: '600',
  },
});
