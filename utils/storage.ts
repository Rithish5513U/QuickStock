import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../models';

// Re-export for backward compatibility
export { Product };

const PRODUCTS_KEY = '@inventory_products';
const CATEGORIES_KEY = '@inventory_categories';

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await AsyncStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await getProducts();
    return products.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error loading product:', error);
    return null;
  }
};

export const saveProduct = async (product: Product): Promise<boolean> => {
  try {
    const products = await getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      // Update existing product
      products[existingIndex] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      // Add new product
      products.push({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error('Error saving product:', error);
    return false;
  }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const products = await getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Categories
export const getCategories = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : ['Electronics', 'Groceries', 'Clothes', 'Stationery', 'Other'];
  } catch (error) {
    console.error('Error loading categories:', error);
    return ['Electronics', 'Groceries', 'Clothes', 'Stationery', 'Other'];
  }
};

export const saveCategory = async (category: string): Promise<boolean> => {
  try {
    const categories = await getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
    return true;
  } catch (error) {
    console.error('Error saving category:', error);
    return false;
  }
};

export const deleteCategory = async (category: string): Promise<boolean> => {
  try {
    const categories = await getCategories();
    const filteredCategories = categories.filter(c => c !== category);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filteredCategories));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};
