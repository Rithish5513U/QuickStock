import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { getProducts, deleteProduct as deleteProductFromStorage, getCategories, saveCategory, deleteCategory as deleteCategoryFromStorage, saveProduct, Product } from '../../utils/storage';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type RootStackParamList = {
  AddEditProduct: { product?: Product } | undefined;
  ProductDetails: { productId: string };
};

export default function ProductsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low' | 'critical'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load products and categories when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    const loadedProducts = await getProducts();
    const loadedCategories = await getCategories();
    setProducts(loadedProducts);
    setCategories(['All', ...loadedCategories]);
    setIsLoading(false);
  };

  // Get stock status for a product
  const getStockStatus = (product: any) => {
    if (product.currentStock <= product.criticalStock) return 'critical';
    if (product.currentStock <= product.minStock) return 'low';
    return 'in-stock';
  };

  // Filter products based on search query and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const stockStatus = getStockStatus(product);
    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return a.buyingPrice - b.buyingPrice;
    if (sortBy === 'stock') return b.currentStock - a.currentStock;
    return 0;
  });

  const handleEditProduct = (product: any) => {
    navigation.navigate('AddEditProduct', { product });
  };

  const handleDeleteProduct = (product: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProductFromStorage(product.id);
            if (success) {
              loadData();
            } else {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (product: any) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleAddProduct = () => {
    navigation.navigate('AddEditProduct');
  };

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditCategoryName(category);
  };

  const handleSaveEditCategory = async (oldCategory: string) => {
    const trimmedName = editCategoryName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (trimmedName !== oldCategory && categories.includes(trimmedName)) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    // Delete old category and save new one
    await deleteCategoryFromStorage(oldCategory);
    const success = await saveCategory(trimmedName);
    
    if (success) {
      // Update products with old category to new category
      const updatedProducts = products.map(p => 
        p.category === oldCategory ? { ...p, category: trimmedName } : p
      );
      for (const product of updatedProducts.filter(p => p.category === trimmedName)) {
        await saveProduct(product);
      }
      
      setEditingCategory(null);
      setEditCategoryName('');
      loadData();
    } else {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = (category: string) => {
    const productsInCategory = products.filter(p => p.category === category).length;
    
    if (productsInCategory > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category has ${productsInCategory} product(s). Please reassign or delete those products first.`
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCategoryFromStorage(category);
            if (success) {
              loadData();
            } else {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (categories.includes(trimmedName)) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    const success = await saveCategory(trimmedName);
    if (success) {
      setNewCategoryName('');
      setShowAddCategory(false);
      loadData();
    } else {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2">Products</Typography>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowFilterModal(true)}>
            <Icon name="filter" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowCategoriesModal(true)}>
            <Icon name="categories" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Products List */}
      <ScrollView style={styles.scrollView}>
        {/* Categories Quick Filter */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory !== category && styles.categoryChipOutline
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Typography 
                  variant="body" 
                  color={selectedCategory === category ? Colors.white : Colors.primary} 
                  style={styles.categoryText}
                >
                  {category}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
        {filteredProducts.length === 0 ? (
          <EmptyState 
            title={searchQuery || selectedCategory !== 'All' ? "No products found" : "No products yet"}
            message={searchQuery || selectedCategory !== 'All' ? "Try adjusting your search or filters" : "Start by adding your first product"}
          />
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onPress={handleProductPress}
            />
          ))
        )}
      </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProduct}>
        <Icon name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Sort & Filter</Typography>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            {/* Sort By Section */}
            <View style={styles.modalSection}>
              <Typography variant="h3" style={styles.sectionTitle}>Sort By</Typography>
              <TouchableOpacity 
                style={[styles.optionItem, sortBy === 'name' && styles.optionItemActive]}
                onPress={() => setSortBy('name')}
              >
                <Typography variant="body" color={sortBy === 'name' ? Colors.primary : Colors.textPrimary}>
                  Name (A-Z)
                </Typography>
                {sortBy === 'name' && <Icon name="check" size={20} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionItem, sortBy === 'price' && styles.optionItemActive]}
                onPress={() => setSortBy('price')}
              >
                <Typography variant="body" color={sortBy === 'price' ? Colors.primary : Colors.textPrimary}>
                  Price (Low to High)
                </Typography>
                {sortBy === 'price' && <Icon name="check" size={20} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionItem, sortBy === 'stock' && styles.optionItemActive]}
                onPress={() => setSortBy('stock')}
              >
                <Typography variant="body" color={sortBy === 'stock' ? Colors.primary : Colors.textPrimary}>
                  Stock Level (High to Low)
                </Typography>
                {sortBy === 'stock' && <Icon name="check" size={20} />}
              </TouchableOpacity>
            </View>

            {/* Stock Status Filter */}
            <View style={styles.modalSection}>
              <Typography variant="h3" style={styles.sectionTitle}>Stock Status</Typography>
              <TouchableOpacity 
                style={[styles.optionItem, stockFilter === 'all' && styles.optionItemActive]}
                onPress={() => setStockFilter('all')}
              >
                <Typography variant="body" color={stockFilter === 'all' ? Colors.primary : Colors.textPrimary}>
                  All Products
                </Typography>
                {stockFilter === 'all' && <Icon name="check" size={20} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionItem, stockFilter === 'in-stock' && styles.optionItemActive]}
                onPress={() => setStockFilter('in-stock')}
              >
                <Typography variant="body" color={stockFilter === 'in-stock' ? Colors.primary : Colors.textPrimary}>
                  In Stock
                </Typography>
                {stockFilter === 'in-stock' && <Icon name="check" size={20} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionItem, stockFilter === 'low' && styles.optionItemActive]}
                onPress={() => setStockFilter('low')}
              >
                <Typography variant="body" color={stockFilter === 'low' ? Colors.primary : Colors.textPrimary}>
                  Low Stock
                </Typography>
                {stockFilter === 'low' && <Icon name="check" size={20} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionItem, stockFilter === 'critical' && styles.optionItemActive]}
                onPress={() => setStockFilter('critical')}
              >
                <Typography variant="body" color={stockFilter === 'critical' ? Colors.primary : Colors.textPrimary}>
                  Critical Stock
                </Typography>
                {stockFilter === 'critical' && <Icon name="check" size={20} />}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button 
                title="Reset Filters" 
                variant="outline"
                onPress={() => {
                  setSortBy('name');
                  setStockFilter('all');
                }}
                style={{ flex: 1 }}
              />
              <Button 
                title="Apply" 
                onPress={() => setShowFilterModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Categories Management Modal */}
      <Modal
        visible={showCategoriesModal}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setShowCategoriesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCategoriesModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Manage Categories</Typography>
              <TouchableOpacity onPress={() => setShowCategoriesModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalSection}>
                <Typography variant="body" color={Colors.textLight} style={styles.helperText}>
                  Categories help organize your products. You can add, edit, or delete categories here.
                </Typography>
                
                {categories.filter(c => c !== 'All').map((category, index) => {
                  const productCount = products.filter(p => p.category === category).length;
                  const isEditing = editingCategory === category;
                  
                  return (
                    <View key={index} style={styles.categoryItem}>
                      {isEditing ? (
                        <View style={styles.editCategoryContainer}>
                          <TextInput
                            style={styles.editCategoryInput}
                            value={editCategoryName}
                            onChangeText={setEditCategoryName}
                            autoFocus
                          />
                          <View style={styles.categoryActions}>
                            <TouchableOpacity 
                              style={styles.categoryActionButton}
                              onPress={() => handleSaveEditCategory(category)}
                            >
                              <Icon name="check" size={20} color={Colors.success} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.categoryActionButton}
                              onPress={() => {
                                setEditingCategory(null);
                                setEditCategoryName('');
                              }}
                            >
                              <Icon name="close" size={20} color={Colors.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={styles.categoryInfo}>
                            <Typography variant="body">{category}</Typography>
                            <Typography variant="caption" color={Colors.textLight}>
                              {productCount} {productCount === 1 ? 'product' : 'products'}
                            </Typography>
                          </View>
                          <View style={styles.categoryActions}>
                            <TouchableOpacity 
                              style={styles.categoryActionButton}
                              onPress={() => handleEditCategory(category)}
                            >
                              <Icon name="edit" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.categoryActionButton}
                              onPress={() => handleDeleteCategory(category)}
                            >
                              <Icon name="delete-bin" size={20} />
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}
                
                {showAddCategory && (
                  <View style={styles.categoryItem}>
                    <View style={styles.editCategoryContainer}>
                      <TextInput
                        style={styles.editCategoryInput}
                        placeholder="Category name"
                        placeholderTextColor={Colors.textLight}
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        autoFocus
                      />
                      <View style={styles.categoryActions}>
                        <TouchableOpacity 
                          style={styles.categoryActionButton}
                          onPress={handleAddCategory}
                        >
                          <Icon name="check" size={20} color={Colors.success} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.categoryActionButton}
                          onPress={() => {
                            setShowAddCategory(false);
                            setNewCategoryName('');
                          }}
                        >
                          <Icon name="close" size={20} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button 
                title="Add Category" 
                onPress={() => setShowAddCategory(true)}
              />
            </View>
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  section: {
    padding: Spacing.lg,
  },
  categoryChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  categoryChipOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Modal Styles
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
    maxHeight: '100%',
    paddingBottom: Spacing.xxl,
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
    maxHeight: 400,
  },
  modalSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  optionItemActive: {
    backgroundColor: Colors.light,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  helperText: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryActionButton: {
    padding: Spacing.xs,
  },
  editCategoryContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editCategoryInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
