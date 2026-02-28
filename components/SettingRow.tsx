import { View, Switch, StyleSheet } from 'react-native';
import Typography from './Typography';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface SettingRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * SettingRow - A reusable settings row with title, optional subtitle, and switch toggle
 * 
 * @example
 * <SettingRow
 *   title="Enable Notifications"
 *   subtitle="Receive stock level alerts"
 *   value={notificationsEnabled}
 *   onValueChange={setNotificationsEnabled}
 * />
 */
export default function SettingRow({ 
  title, 
  subtitle, 
  value, 
  onValueChange,
  disabled = false
}: SettingRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Typography variant="body" style={styles.title}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={Colors.textLight}>
            {subtitle}
          </Typography>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.textLight, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
});
