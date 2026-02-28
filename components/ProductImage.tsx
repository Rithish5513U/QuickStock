import { Image, StyleSheet, View } from 'react-native';
import Icon from './Icon';
import { mediumScale } from '../constants/size';

interface ProductImageProps {
  imageUri?: string;
  size?: number;
}

export default function ProductImage({ imageUri, size = 60 }: ProductImageProps) {
  const responsiveSize = mediumScale(size);
  return (
    <View style={[styles.container, { width: responsiveSize, height: responsiveSize }]}>
      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Icon name="placeholder" size={responsiveSize * 0.5} color="#CCCCCC" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: mediumScale(12),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
