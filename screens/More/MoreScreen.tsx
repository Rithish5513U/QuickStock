import { StyleSheet, View } from 'react-native';
import Typography from '../../components/Typography';
import { Colors } from '../../constants/colors';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Typography variant="h2">More</Typography>
      <Typography variant="body" style={styles.subtitle}>
        Coming soon...
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subtitle: {
    marginTop: 10,
  },
});
