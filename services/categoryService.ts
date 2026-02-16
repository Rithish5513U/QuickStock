import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_KEY = '@inventory_categories';

/**
 * Category Service - Handles product category management
 */
export class CategoryService {
  static async getAll(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(CATEGORIES_KEY);
      return data ? JSON.parse(data) : ['Electronics', 'Groceries', 'Clothes', 'Stationery', 'Other'];
    } catch (error) {
      console.error('Error loading categories:', error);
      return ['Electronics', 'Groceries', 'Clothes', 'Stationery', 'Other'];
    }
  }

  static async save(category: string): Promise<boolean> {
    try {
      const categories = await this.getAll();
      if (!categories.includes(category)) {
        categories.push(category);
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      }
      return true;
    } catch (error) {
      console.error('Error saving category:', error);
      return false;
    }
  }

  static async delete(category: string): Promise<boolean> {
    try {
      const categories = await this.getAll();
      const filteredCategories = categories.filter(c => c !== category);
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filteredCategories));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  static async update(oldCategory: string, newCategory: string): Promise<boolean> {
    try {
      await this.delete(oldCategory);
      return await this.save(newCategory);
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  }

  static exists(categories: string[], category: string): boolean {
    return categories.includes(category);
  }

  /**
   * Clear all categories from storage
   */
  static async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(CATEGORIES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing categories:', error);
      return false;
    }
  }
}
