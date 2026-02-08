import { Text, StyleSheet, TextStyle } from 'react-native';

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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#006FFD',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006FFD',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  body: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: '#999999',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
