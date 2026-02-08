import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';

interface StatCardProps {
  number: string | number;
  label: string;
  backgroundColor: string;
}

export default function StatCard({ number, label, backgroundColor }: StatCardProps) {
  return (
    <Card backgroundColor={backgroundColor} style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
