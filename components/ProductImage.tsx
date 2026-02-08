import { Image, StyleSheet, View } from 'react-native';
import Icon from './Icon';

interface ProductImageProps {
  imageUri?: string;
  size?: number;
}

export default function ProductImage({ imageUri, size = 60 }: ProductImageProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Icon name="placeholder" size={size * 0.5} style={styles.placeholderIcon} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    tintColor: '#CCCCCC',
  },
});
