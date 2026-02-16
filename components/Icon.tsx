import { Image, ImageStyle, StyleSheet } from 'react-native';
import { mediumScale } from '../constants/size';

export type IconName =
  | 'add'
  | 'alert'
  | 'apple'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'barcode-scan'
  | 'camera'
  | 'categories'
  | 'chat'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'create'
  | 'delete'
  | 'delete-bin'
  | 'edit'
  | 'energy'
  | 'explore'
  | 'eye-invisible'
  | 'eye-visible'
  | 'facebook'
  | 'filter'
  | 'google'
  | 'hamburger-menu'
  | 'heart-filled'
  | 'heart-outlined'
  | 'image'
  | 'inbox'
  | 'info'
  | 'inventory'
  | 'linkedin'
  | 'minus'
  | 'placeholder'
  | 'play'
  | 'product'
  | 'profile'
  | 'receipt'
  | 'search'
  | 'send'
  | 'settings'
  | 'shopping-bag-filled'
  | 'shopping-bag-outlined'
  | 'sort'
  | 'star-filled'
  | 'star-outlined'
  | 'store'
  | 'success'
  | 'warning';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ImageStyle;
}

const iconMap: Record<IconName, any> = {
  'add': require('../assets/icons/Add.png'),
  'alert': require('../assets/icons/Warning.png'),
  'apple': require('../assets/icons/Apple.png'),
  'arrow-down': require('../assets/icons/Arrow Down.png'),
  'arrow-left': require('../assets/icons/Arrow Left.png'),
  'arrow-right': require('../assets/icons/Arrow Right.png'),
  'arrow-up': require('../assets/icons/Arrow Up.png'),
  'barcode-scan': require('../assets/icons/Placeholder.png'),
  'camera': require('../assets/icons/Camera.png'),
  'categories': require('../assets/icons/Categories.png'),
  'chat': require('../assets/icons/Chat.png'),
  'check': require('../assets/icons/Check.png'),
  'chevron-down': require('../assets/icons/Arrow Down.png'),
  'close': require('../assets/icons/Close.png'),
  'create': require('../assets/icons/Create.png'),
  'delete': require('../assets/icons/Delete.png'),
  'delete-bin': require('../assets/icons/Delete Bin.png'),
  'edit': require('../assets/icons/Edit.png'),
  'energy': require('../assets/icons/Energy.png'),
  'explore': require('../assets/icons/Explore.png'),
  'eye-invisible': require('../assets/icons/Eye Invisible.png'),
  'eye-visible': require('../assets/icons/Eye Visible.png'),
  'facebook': require('../assets/icons/Facebook.png'),
  'filter': require('../assets/icons/Filter.png'),
  'google': require('../assets/icons/Google.png'),
  'hamburger-menu': require('../assets/icons/Hamburger Menu.png'),
  'heart-filled': require('../assets/icons/Heart Filled.png'),
  'heart-outlined': require('../assets/icons/Heart Outlined.png'),
  'image': require('../assets/icons/Image.png'),
  'inbox': require('../assets/icons/Inbox.png'),
  'info': require('../assets/icons/Info.png'),
  'inventory': require('../assets/icons/Inbox.png'),
  'linkedin': require('../assets/icons/LinkedIn.png'),
  'minus': require('../assets/icons/Minus.png'),
  'placeholder': require('../assets/icons/Placeholder.png'),
  'play': require('../assets/icons/Play.png'),
  'product': require('../assets/icons/Shopping Bag Outlined.png'),
  'profile': require('../assets/icons/Profile.png'),
  'receipt': require('../assets/icons/Inbox.png'),
  'search': require('../assets/icons/Search.png'),
  'send': require('../assets/icons/Send.png'),
  'settings': require('../assets/icons/Settings.png'),
  'shopping-bag-filled': require('../assets/icons/Shopping Bag Filled.png'),
  'shopping-bag-outlined': require('../assets/icons/Shopping Bag Outlined.png'),
  'sort': require('../assets/icons/Sort.png'),
  'star-filled': require('../assets/icons/Star Filled.png'),
  'star-outlined': require('../assets/icons/Star Outlined.png'),
  'store': require('../assets/icons/Store.png'),
  'success': require('../assets/icons/Success.png'),
  'warning': require('../assets/icons/Warning.png'),
};

export default function Icon({ name, size = mediumScale(24), color, style }: IconProps) {
  return (
    <Image
      source={iconMap[name]}
      style={[styles.icon, { width: size, height: size }, color && { tintColor: color }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    width: mediumScale(24),
    height: mediumScale(24),
  },
});
