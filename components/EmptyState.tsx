import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { widthScale, heightScale, mediumScale } from '../constants/size';

interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: widthScale(40),
    alignItems: 'center',
  },
  title: {
    fontSize: mediumScale(16),
    color: '#666666',
    fontWeight: '600',
    marginBottom: heightScale(5),
  },
  message: {
    fontSize: mediumScale(14),
    color: '#999999',
  },
});
