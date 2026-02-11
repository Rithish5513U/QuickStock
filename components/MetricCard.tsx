import { View, StyleSheet } from 'react-native';
import Typography from './Typography';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface MetricCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function MetricCard({ label, value, color = Colors.textPrimary, icon, subtitle }: MetricCardProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <View style={styles.content}>
        <Typography variant="caption" color={Colors.textLight} style={styles.label}>
          {label}
        </Typography>
        <Typography variant="h2" color={color} style={styles.value}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={Colors.textLight}>
            {subtitle}
          </Typography>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  value: {
    fontWeight: '700',
  },
});
