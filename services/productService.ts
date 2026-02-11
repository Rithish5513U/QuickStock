import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../models';

const PRODUCTS_KEY = '@inventory_products';

/**
 * Product Service - Handles all product-related business logic
 */
export class ProductService {
  // ========== CRUD Operations ==========
  
  static async getAll(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Product | null> {
    try {
      const products = await this.getAll();
      return products.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error loading product:', error);
      return null;
    }
  }

  static async save(product: Product): Promise<boolean> {
    try {
      const products = await this.getAll();
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
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const products = await this.getAll();
      const filteredProducts = products.filter(p => p.id !== id);
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  // ========== Business Logic ==========

  static async updateStock(productId: string, quantity: number, operation: 'add' | 'remove'): Promise<boolean> {
    try {
      const product = await this.getById(productId);
      if (!product) return false;

      const newStock = operation === 'add' 
        ? product.currentStock + quantity 
        : product.currentStock - quantity;

      if (newStock < 0) return false;

      return await this.save({ ...product, currentStock: newStock });
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  }

  static async recordSale(productId: string, quantity: number, sellingPrice: number, costPrice: number): Promise<boolean> {
    try {
      const product = await this.getById(productId);
      if (!product || product.currentStock < quantity) return false;

      const revenue = sellingPrice * quantity;
      const profit = (sellingPrice - costPrice) * quantity;

      const updatedProduct: Product = {
        ...product,
        currentStock: product.currentStock - quantity,
        soldUnits: (product.soldUnits || 0) + quantity,
        revenue: (product.revenue || 0) + revenue,
        profit: (product.profit || 0) + profit,
      };

      return await this.save(updatedProduct);
    } catch (error) {
      console.error('Error recording sale:', error);
      return false;
    }
  }

  static getStockStatus(product: Product): { label: string; color: string } {
    if (product.currentStock <= product.criticalStock) {
      return { label: 'Critical', color: '#F44336' };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Low Stock', color: '#FFC107' };
    }
    if (product.currentStock === 0) {
      return { label: 'Out of Stock', color: '#999999' };
    }
    return { label: 'In Stock', color: '#4CAF50' };
  }

  static isAvailable(product: Product, requestedQuantity: number): boolean {
    return product.currentStock >= requestedQuantity;
  }

  static calculateProfitMargin(product: Product): number {
    if (product.sellingPrice === 0) return 0;
    return ((product.sellingPrice - product.buyingPrice) / product.sellingPrice) * 100;
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.sku?.toLowerCase().includes(lowerQuery) ||
      p.barcode?.toLowerCase().includes(lowerQuery)
    );
  }

  static async getByBarcode(barcode: string): Promise<Product | null> {
    const products = await this.getAll();
    return products.find(p => p.barcode === barcode || p.sku === barcode) || null;
  }

  static async filterByCategory(category: string): Promise<Product[]> {
    const products = await this.getAll();
    return category === 'All' 
      ? products 
      : products.filter(p => p.category === category);
  }

  static async sortProducts(products: Product[], sortBy: 'name' | 'price' | 'stock'): Promise<Product[]> {
    const sorted = [...products];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => a.buyingPrice - b.buyingPrice);
      case 'stock':
        return sorted.sort((a, b) => b.currentStock - a.currentStock);
      default:
        return sorted;
    }
  }

  static async getLowStockProducts(): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.currentStock <= p.minStock);
  }

  static async getCriticalStockProducts(): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.currentStock <= p.criticalStock);
  }

  static async getTopSellingProducts(limit: number = 10): Promise<Product[]> {
    const products = await this.getAll();
    return products
      .sort((a, b) => (b.soldUnits || 0) - (a.soldUnits || 0))
      .slice(0, limit);
  }
}
