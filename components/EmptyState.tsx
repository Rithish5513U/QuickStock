import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';

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
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: '#999999',
  },
});
