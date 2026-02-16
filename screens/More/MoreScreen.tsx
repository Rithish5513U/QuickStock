import { StyleSheet, View } from 'react-native';
import Typography from '../../components/Typography';
import { Colors } from '../../constants/colors';
import Icon from '../../components/Icon';
import { widthScale, heightScale, mediumScale } from '../../constants/size';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Icon name="apple" style={styles.imageContainer} />
      </View>
      <Typography variant="h2">More</Typography>
      <Typography variant="body" style={styles.subtitle}>
        Coming Soon
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
    padding: mediumScale(20),
  },
  subtitle: {
    marginTop: heightScale(10),
  },
  profileContainer: {
    width: widthScale(100),
    height: heightScale(100),
    borderRadius: mediumScale(50),
    backgroundColor: '#eb1186',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: widthScale(100),
    height: heightScale(100),
    borderRadius: mediumScale(50),
    alignItems: 'center',
    justifyContent: 'center'
  }
});
