import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  style 
}: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text,
        styles[`${variant}Text` as keyof typeof styles] as TextStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#006FFD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondary: {
    backgroundColor: '#2897FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#006FFD',
    elevation: 0,
  },
  small: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  medium: {
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  large: {
    paddingHorizontal: 80,
    paddingVertical: 18,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#006FFD',
  },
});
