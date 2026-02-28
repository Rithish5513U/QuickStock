import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';

// Map custom icon names to Material Icons
const iconNameMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  // Keep existing Material Icons names
  'add': 'add',
  'check': 'check',
  'close': 'close',
  'search': 'search',
  'delete': 'delete',
  'edit': 'edit',
  'send': 'send',
  'info': 'info',
  'camera': 'camera-alt',
  'image': 'image',
  'store': 'store',
  'create': 'create',
  
  // Custom mappings
  'alert': 'warning',
  'receipt': 'receipt',
  'inventory': 'inventory',
  'inbox': 'inbox',
  'minus': 'remove',
  'delete-bin': 'delete',
  'arrow-left': 'arrow-back',
  'arrow-right': 'arrow-forward',
  'filter': 'filter-list',
  'chevron-down': 'keyboard-arrow-down',
  'barcode-scan': 'qr-code-scanner',
  'categories': 'category',
  'product': 'shopping-cart',
  'profile': 'account-circle',
  'placeholder': 'image',
  
  // Tab bar icon mappings
  'shopping-bag-filled': 'shopping-bag',
  'user': 'person',
  'hamburger-menu': 'menu',
  'star-filled': 'star',
};

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'black', style }) => {
  // Get mapped icon name or use the original if not in map
  const materialIconName = (iconNameMap[name] || name) as keyof typeof MaterialIcons.glyphMap;
  
  return <MaterialIcons name={materialIconName} size={size} color={color} style={style} />;
};

export default Icon;