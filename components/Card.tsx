import { View, StyleSheet, ViewStyle } from 'react-native';
import { mediumScale, heightScale } from '../constants/size';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function Card({ children, style, backgroundColor = '#FFFFFF' }: CardProps) {
  return (
    <View style={[styles.card, { backgroundColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: mediumScale(15),
    padding: mediumScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: heightScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: mediumScale(4),
    elevation: 3,
    overflow: 'hidden',
  },
});
