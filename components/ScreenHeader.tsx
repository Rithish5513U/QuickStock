import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from './Typography';
import Icon from './Icon';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { mediumScale, heightScale } from '../constants/size';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  showBackButton?: boolean;
}

export default function ScreenHeader({ 
  title, 
  subtitle,
  onBack, 
  rightActions,
  showBackButton = true 
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {showBackButton && onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={mediumScale(24)} />
        </TouchableOpacity>
      )}
      <View style={styles.titleContainer}>
        <Typography variant="h2">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color={Colors.textLight}>
            {subtitle}
          </Typography>
        )}
      </View>
      {rightActions && <View style={styles.actions}>{rightActions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + heightScale(20),
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
