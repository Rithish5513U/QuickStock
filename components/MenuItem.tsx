import { StyleSheet, View, Pressable } from 'react-native';
import Card from './Card';
import Typography from './Typography';
import Icon from './Icon';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { mediumScale } from '../constants/size';

/**
 * MenuItem Component
 * 
 * Reusable menu item with icon, title, subtitle, and navigation arrow.
 * Used for navigation menus and settings screens.
 * 
 * @param icon - Icon name to display
 * @param title - Main text to display
 * @param subtitle - Optional secondary text
 * @param onPress - Callback when item is pressed
 * @param iconColor - Optional custom icon color
 * @param danger - Whether to display in danger/warning style
 */

interface MenuItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  danger?: boolean;
}

export default function MenuItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  iconColor, 
  danger 
}: MenuItemProps) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={styles.menuItem} backgroundColor={pressed ? '#F0F0F0' : '#FFFFFF'}>
          <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
            <Icon 
              name={icon} 
              size={mediumScale(24)} 
              color={iconColor || (danger ? Colors.danger : Colors.primary)} 
            />
          </View>
          <View style={styles.menuItemText}>
            <Typography 
              variant="body" 
              style={styles.menuTitle}
              color={danger ? Colors.danger : Colors.textPrimary}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color={Colors.textLight}>
                {subtitle}
              </Typography>
            )}
          </View>
          <Icon name="arrow-right" size={mediumScale(20)} color={Colors.textLight} />
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: mediumScale(40),
    height: mediumScale(40),
    borderRadius: mediumScale(20),
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerDanger: {
    backgroundColor: '#FFE5E5',
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
  },
});
