import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { getProductById, deleteProduct, Product } from '../../utils/storage';

type RootStackParamList = {
  ProductDetails: { productId: string };
  AddEditProduct: { product?: Product };
};
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export default function ProductDetailsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const productId = (route.params as any)?.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) {
      Alert.alert('Error', 'Product not found');
      navigation.goBack();
      return;
    }

    const loadedProduct = await getProductById(productId);
    if (loadedProduct) {
      setProduct(loadedProduct);
    } else {
      Alert.alert('Error', 'Product not found');
      navigation.goBack();
    }
    setIsLoading(false);
  };

  const getStockStatus = () => {
    if (!product) return { status: 'Unknown', color: Colors.textLight };
    if (product.currentStock <= product.criticalStock) {
      return { status: 'Critical', color: Colors.danger };
    }
    if (product.currentStock <= product.minStock) {
      return { status: 'Low', color: Colors.warning };
    }
    return { status: 'In Stock', color: Colors.success };
  };

  const stockStatus = getStockStatus();

  const handleEdit = () => {
    navigation.navigate('AddEditProduct', { product: product || undefined });
  };

  const handleDelete = async () => {
    if (!product) return;

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProduct(product.id);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Typography variant="body" color={Colors.textLight}>Product not found</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Product Details</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="product" size={80} color={Colors.textLight} />
            </View>
          )}
        </View>

        {/* Product Name & Category */}
        <Card style={styles.section}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Typography variant="h2" style={styles.productName}>{product.name}</Typography>
              <Typography variant="body" color={Colors.textLight}>{product.category}</Typography>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}20` }]}>
              <Typography variant="caption" color={stockStatus.color} style={{ fontWeight: '600' }}>
                {stockStatus.status}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Stock & Price Info */}
        <Card style={styles.section}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Typography variant="caption" color={Colors.textLight}>Current Stock</Typography>
              <Typography variant="h3" style={styles.infoValue}>{product.currentStock}</Typography>
            </View>
            <View style={styles.infoItem}>
              <Typography variant="caption" color={Colors.textLight}>Price</Typography>
              <Typography variant="h3" style={styles.infoValue}>${product.buyingPrice.toFixed(2)}</Typography>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Typography variant="caption" color={Colors.textLight}>Min Stock</Typography>
              <Typography variant="body" style={styles.infoValue}>{product.minStock}</Typography>
            </View>
            <View style={styles.infoItem}>
              <Typography variant="caption" color={Colors.textLight}>Critical Stock</Typography>
              <Typography variant="body" style={styles.infoValue}>{product.criticalStock}</Typography>
            </View>
          </View>
        </Card>

        {/* Product Details */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Product Information</Typography>
          
          {product.sku && (
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>SKU</Typography>
              <Typography variant="body" style={styles.detailValue}>{product.sku}</Typography>
            </View>
          )}
          
          {product.barcode && (
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Barcode</Typography>
              <Typography variant="body" style={styles.detailValue}>{product.barcode}</Typography>
            </View>
          )}
          
          {product.description && (
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Description</Typography>
              <Typography variant="body" style={styles.detailDescription}>
                {product.description}
              </Typography>
            </View>
          )}
        </Card>

        {/* Timestamps */}
        <Card style={styles.section}>
          <View style={styles.detailRow}>
            <Typography variant="caption" color={Colors.textLight}>Created</Typography>
            <Typography variant="caption" color={Colors.textLight}>
              {new Date(product.createdAt).toLocaleDateString()}
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="caption" color={Colors.textLight}>Last Updated</Typography>
            <Typography variant="caption" color={Colors.textLight}>
              {new Date(product.updatedAt).toLocaleDateString()}
            </Typography>
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button 
          title="Edit Product" 
          onPress={handleEdit}
          style={{ flex: 1 }}
        />
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="delete-bin" size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  section: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.background,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  detailValue: {
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.md,
  },
  detailDescription: {
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
    marginLeft: Spacing.md,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButton: {
    width: 56,
    height: 48,
    backgroundColor: `${Colors.danger}15`,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
