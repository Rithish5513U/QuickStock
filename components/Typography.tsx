import { Text, StyleSheet, TextStyle } from 'react-native';
import { mediumScale } from '../constants/size';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'subtitle';
  color?: string;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
}

export default function Typography({ 
  children, 
  variant = 'body', 
  color,
  style,
  align = 'left'
}: TypographyProps) {
  return (
    <Text style={[
      styles[variant],
      color && { color },
      { textAlign: align },
      style
    ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: mediumScale(40),
    fontWeight: 'bold',
    color: '#006FFD',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: mediumScale(32),
    fontWeight: 'bold',
    color: '#006FFD',
  },
  h3: {
    fontSize: mediumScale(20),
    fontWeight: 'bold',
    color: '#000000',
  },
  body: {
    fontSize: mediumScale(14),
    color: '#666666',
    lineHeight: mediumScale(20),
  },
  caption: {
    fontSize: mediumScale(12),
    color: '#999999',
  },
  subtitle: {
    fontSize: mediumScale(16),
    color: '#666666',
  },
});
