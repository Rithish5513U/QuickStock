import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './Card';
import Typography from './Typography';
import Icon from './Icon';
import ProductImage from './ProductImage';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Product } from '../utils/storage';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPress?: (product: Product) => void;
}

export default function ProductCard({ product, onEdit, onDelete, onPress }: ProductCardProps) {
  const getStockStatus = () => {
    if (!product.criticalStock && !product.minStock) {
      return 'green';
    }
    if (product.criticalStock && product.currentStock <= product.criticalStock) {
      return 'red';
    }
    if (product.minStock && product.currentStock <= product.minStock) {
      return 'yellow';
    }
    return 'green';
  };

  const stockStatus = getStockStatus();

  return (
    <Card style={styles.productCard}>
      <TouchableOpacity 
        onPress={() => onPress?.(product)}
        activeOpacity={0.7}
      >
        <View style={styles.productRow}>
          <ProductImage imageUri={product.image} size={60} />
          
          <View style={styles.productInfo}>
            <View style={styles.nameRow}>
              <View style={styles.nameContainer}>
                <Typography variant="h3" style={styles.productName}>
                  {product.name}
                </Typography>
                <Typography variant="caption" color={Colors.textLight}>
                  {product.category}
                </Typography>
              </View>
              <View style={[
                styles.stockIndicator, 
                stockStatus === 'green' && styles.stockGreen,
                stockStatus === 'yellow' && styles.stockYellow,
                stockStatus === 'red' && styles.stockRed,
              ]} />
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.productDetailItem}>
                <Typography variant="caption" color={Colors.textLight}>Stock</Typography>
                <Typography variant="body" style={styles.productDetailValue}>
                  {product.currentStock}
                </Typography>
              </View>
              <View style={styles.productDetailItem}>
                <Typography variant="caption" color={Colors.textLight}>Price</Typography>
                <Typography variant="body" style={styles.productDetailValue}>
                  ${product.price.toFixed(2)}
                </Typography>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onEdit?.(product)}
                >
                  <Icon name="edit" size={18} style={{ tintColor: Colors.primary }} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onDelete?.(product)}
                >
                  <Icon name="delete-bin" size={18} style={{ tintColor: Colors.danger }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  productCard: {
    marginBottom: Spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  nameContainer: {
    flex: 1,
  },
  productName: {
    marginBottom: 2,
    fontSize: 16,
  },
  stockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: Spacing.sm,
  },
  stockGreen: {
    backgroundColor: Colors.success,
  },
  stockYellow: {
    backgroundColor: Colors.warning,
  },
  stockRed: {
    backgroundColor: Colors.danger,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  productDetailItem: {
    minWidth: 60,
  },
  productDetailValue: {
    fontWeight: '600',
    marginTop: 2,
    fontSize: 13,
  },
  productActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: 'auto',
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
