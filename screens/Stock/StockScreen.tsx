import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { getProducts, saveProduct, Product } from '../../utils/storage';

export default function StockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [updateType, setUpdateType] = useState<'add' | 'remove'>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    const loadedProducts = await getProducts();
    setProducts(loadedProducts.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(false);
    setQuantity('');
    setReason('');
    setUpdateType('add');
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (updateType === 'remove' && qty > selectedProduct.currentStock) {
      Alert.alert('Error', `Cannot remove ${qty} units. Only ${selectedProduct.currentStock} available`);
      return;
    }

    const newStock = updateType === 'add' 
      ? selectedProduct.currentStock + qty 
      : selectedProduct.currentStock - qty;

    const updatedProduct = {
      ...selectedProduct,
      currentStock: newStock,
    };

    const success = await saveProduct(updatedProduct);
    if (success) {
      Alert.alert(
        'Success',
        `Stock ${updateType === 'add' ? 'added' : 'removed'} successfully!`,
        [{ text: 'OK', onPress: () => {
          setSelectedProduct(null);
          setQuantity('');
          setReason('');
          loadProducts();
        }}]
      );
    } else {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return { label: 'Out of Stock', color: Colors.textLight };
    if (product.currentStock <= product.criticalStock) return { label: 'Critical', color: Colors.danger };
    if (product.currentStock <= product.minStock) return { label: 'Low', color: Colors.warning };
    return { label: 'In Stock', color: Colors.success };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2">Stock Management</Typography>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => setShowProductModal(true)}
        >
          <Icon name="search" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Selected Product Card */}
        {selectedProduct ? (
          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>Selected Product</Typography>
            <View style={styles.productHeader}>
              <ProductImage imageUri={selectedProduct.image} size={60} />
              <View style={styles.productDetails}>
                <Typography variant="h3">{selectedProduct.name}</Typography>
                <Typography variant="body" color={Colors.textLight}>
                  {selectedProduct.category}
                </Typography>
                <View style={styles.stockBadge}>
                  <Typography variant="caption" color={getStockStatus(selectedProduct).color}>
                    Current Stock: {selectedProduct.currentStock}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Update Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, updateType === 'add' && styles.typeButtonActive]}
                onPress={() => setUpdateType('add')}
              >
                <Icon name="add" size={20} color={updateType === 'add' ? Colors.white : Colors.primary} />
                <Typography 
                  variant="body" 
                  color={updateType === 'add' ? Colors.white : Colors.primary}
                  style={styles.typeButtonText}
                >
                  Add Stock
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, updateType === 'remove' && styles.typeButtonActive]}
                onPress={() => setUpdateType('remove')}
              >
                <Icon name="minus" size={20} color={updateType === 'remove' ? Colors.white : Colors.danger} />
                <Typography 
                  variant="body" 
                  color={updateType === 'remove' ? Colors.white : Colors.danger}
                  style={styles.typeButtonText}
                >
                  Remove Stock
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <View style={styles.inputGroup}>
              <Typography variant="body" style={styles.label}>Quantity *</Typography>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                placeholderTextColor={Colors.textLight}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* Reason Input */}
            <View style={styles.inputGroup}>
              <Typography variant="body" style={styles.label}>Reason (Optional)</Typography>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="E.g., New stock arrival, Damaged goods, etc."
                placeholderTextColor={Colors.textLight}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button 
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setSelectedProduct(null);
                  setQuantity('');
                  setReason('');
                }}
                style={{ flex: 1 }}
              />
              <Button 
                title={`${updateType === 'add' ? 'Add' : 'Remove'} Stock`}
                onPress={handleUpdateStock}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.section}>
            <EmptyState 
              title="No product selected"
              message="Tap the search icon to select a product"
            />
          </Card>
        )}

        {/* Quick Stock Overview */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Stock Overview</Typography>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Typography variant="h3" color={Colors.primary}>
                {products.length}
              </Typography>
              <Typography variant="caption" color={Colors.textLight}>Total Products</Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="h3" color={Colors.success}>
                {products.filter(p => p.currentStock > p.minStock).length}
              </Typography>
              <Typography variant="caption" color={Colors.textLight}>In Stock</Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="h3" color={Colors.warning}>
                {products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length}
              </Typography>
              <Typography variant="caption" color={Colors.textLight}>Low Stock</Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="h3" color={Colors.danger}>
                {products.filter(p => p.currentStock === 0).length}
              </Typography>
              <Typography variant="caption" color={Colors.textLight}>Out of Stock</Typography>
            </View>
          </View>
        </Card>

        {/* Recent Products Needing Attention */}
        <Card style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Needs Attention</Typography>
          {products.filter(p => p.currentStock <= p.minStock).length === 0 ? (
            <EmptyState 
              title="All good!"
              message="No products need immediate attention"
            />
          ) : (
            products
              .filter(p => p.currentStock <= p.minStock)
              .slice(0, 5)
              .map(product => {
                const status = getStockStatus(product);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productListItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <ProductImage imageUri={product.image} size={50} />
                    <View style={styles.productListInfo}>
                      <Typography variant="body" style={styles.productListName}>
                        {product.name}
                      </Typography>
                      <View style={styles.productListStats}>
                        <Typography variant="caption" color={status.color}>
                          {status.label}
                        </Typography>
                        <Typography variant="caption" color={Colors.textLight}>
                          Stock: {product.currentStock}
                        </Typography>
                      </View>
                    </View>
                    <Icon name="arrow-right" size={20} color={Colors.textLight} />
                  </TouchableOpacity>
                );
              })
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowProductModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Select Product</Typography>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="search" size={20} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.modalScrollView}>
              {filteredProducts.length === 0 ? (
                <EmptyState 
                  title="No products found"
                  message="Try adjusting your search"
                />
              ) : (
                filteredProducts.map(product => {
                  const status = getStockStatus(product);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productItem}
                      onPress={() => handleSelectProduct(product)}
                    >
                      <ProductImage imageUri={product.image} size={50} />
                      <View style={styles.productInfo}>
                        <Typography variant="body" style={styles.productName}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color={Colors.textLight}>
                          {product.category} • Stock: {product.currentStock}
                        </Typography>
                        <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                          <Typography variant="caption" color={status.color}>
                            {status.label}
                          </Typography>
                        </View>
                      </View>
                      <Icon name="arrow-right" size={20} color={Colors.textLight} />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  iconButton: {
    padding: Spacing.sm,
  },
  section: {
    margin: Spacing.lg,
    marginBottom: 0,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  stockBadge: {
    marginTop: Spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  productListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  productListInfo: {
    flex: 1,
  },
  productListName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  productListStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalScrollView: {
    padding: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
});
