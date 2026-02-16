import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { Product } from '../../models';
import { ProductService, CategoryService } from '../../services';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';

export default function SelectProductScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedProducts = await ProductService.getAll();
    const loadedCategories = await CategoryService.getAll();
    setProducts(loadedProducts);
    setCategories(['All', ...loadedCategories]);
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= product.criticalStock) return 'critical';
    if (product.currentStock <= product.minStock) return 'low';
    return 'in-stock';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const stockStatus = getStockStatus(product);
    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'stock') return b.currentStock - a.currentStock;
    return 0;
  });

  const handleSelectProduct = (product: Product) => {
    const onSelectProduct = route.params?.onSelectProduct;
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    navigation.goBack();
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSortBy('name');
    setStockFilter('all');
    setShowFilterModal(false);
  };

  const activeFilterCount = [
    selectedCategory !== 'All',
    sortBy !== 'name',
    stockFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Select Product</Typography>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter" size={20} color={activeFilterCount > 0 ? Colors.white : Colors.textPrimary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Typography variant="caption" style={styles.filterBadgeText}>{activeFilterCount}</Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            message={searchQuery ? "Try adjusting your search or filters" : "No products available"}
          />
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map(product => (
              <TouchableOpacity
                key={product.id}
                onPress={() => handleSelectProduct(product)}
                disabled={product.currentStock === 0}
              >
                <Card style={styles.productCard}>
                  <View style={product.currentStock === 0 ? styles.productCardContent : styles.productCardContentActive}>
                    <View style={styles.productInfo}>
                      <Typography variant="body" style={styles.productName}>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color={Colors.textLight} style={styles.productCategory}>
                        {product.category}
                      </Typography>
                      <View style={styles.productDetails}>
                        <Typography variant="body" style={styles.productPrice}>
                        ${product.sellingPrice.toFixed(2)}
                        </Typography>
                        <View style={[
                          styles.stockBadge,
                          product.currentStock === 0 && styles.stockBadgeCritical,
                          product.currentStock <= product.criticalStock && product.currentStock > 0 && styles.stockBadgeCritical,
                          product.currentStock <= product.minStock && product.currentStock > product.criticalStock && styles.stockBadgeLow
                        ]}>
                          <Typography variant="caption" style={styles.stockText}>
                            {product.currentStock === 0 ? 'Out of Stock' : `Stock: ${product.currentStock}`}
                          </Typography>
                        </View>
                      </View>
                    </View>
                    <Icon
                      name={product.currentStock === 0 ? "close" : "arrow-right"}
                      size={24}
                      color={product.currentStock === 0 ? Colors.danger : Colors.primary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Filters</Typography>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Typography variant="body" style={styles.filterLabel}>Category</Typography>
                <View style={styles.chipContainer}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.chip,
                        selectedCategory === category && styles.chipActive
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Typography
                        variant="caption"
                        color={selectedCategory === category ? Colors.white : Colors.textPrimary}
                      >
                        {category}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Typography variant="body" style={styles.filterLabel}>Sort By</Typography>
                <View style={styles.chipContainer}>
                  {[
                    { value: 'name', label: 'Name' },
                    { value: 'price', label: 'Price' },
                    { value: 'stock', label: 'Stock' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        sortBy === option.value && styles.chipActive
                      ]}
                      onPress={() => setSortBy(option.value as any)}
                    >
                      <Typography
                        variant="caption"
                        color={sortBy === option.value ? Colors.white : Colors.textPrimary}
                      >
                        {option.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stock Filter */}
              <View style={styles.filterSection}>
                <Typography variant="body" style={styles.filterLabel}>Stock Status</Typography>
                <View style={styles.chipContainer}>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'in-stock', label: 'In Stock' },
                    { value: 'low', label: 'Low Stock' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        stockFilter === option.value && styles.chipActive
                      ]}
                      onPress={() => setStockFilter(option.value as any)}
                    >
                      <Typography
                        variant="caption"
                        color={stockFilter === option.value ? Colors.white : Colors.textPrimary}
                      >
                        {option.label}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Typography variant="body" color={Colors.primary}>Reset</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Typography variant="body" color={Colors.white}>Apply Filters</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: heightScale(60),
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: mediumScale(16),
    color: Colors.textPrimary,
  },
  filterButton: {
    width: widthScale(48),
    height: heightScale(48),
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: mediumScale(-4),
    right: mediumScale(-4),
    backgroundColor: Colors.danger,
    borderRadius: mediumScale(10),
    minWidth: widthScale(20),
    height: heightScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mediumScale(4),
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: mediumScale(12),
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  productList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  productCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  productCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  productCardContentActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    marginBottom: mediumScale(4),
  },
  productCategory: {
    marginBottom: Spacing.xs,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: mediumScale(4),
  },
  productPrice: {
    fontWeight: '600',
    color: Colors.primary,
  },
  stockBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: mediumScale(2),
    borderRadius: mediumScale(4),
  },
  stockBadgeLow: {
    backgroundColor: Colors.warning + '20',
  },
  stockBadgeCritical: {
    backgroundColor: Colors.danger + '20',
  },
  stockText: {
    fontSize: mediumScale(12),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabel: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: mediumScale(20),
    borderWidth: mediumScale(1),
    borderColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mediumScale(8),
    borderWidth: mediumScale(1),
    borderColor: Colors.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mediumScale(8),
    backgroundColor: Colors.primary,
  },
});
