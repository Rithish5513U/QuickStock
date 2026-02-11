import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../models';

const CUSTOMERS_KEY = '@inventory_customers';

/**
 * Customer Service - Handles all customer-related business logic
 */
export class CustomerService {
  // ========== CRUD Operations ==========

  static async getAll(): Promise<Customer[]> {
    try {
      const data = await AsyncStorage.getItem(CUSTOMERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Customer | null> {
    try {
      const customers = await this.getAll();
      return customers.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error loading customer:', error);
      return null;
    }
  }

  static async getByPhone(phone: string): Promise<Customer | null> {
    try {
      const customers = await this.getAll();
      return customers.find(c => c.phone === phone) || null;
    } catch (error) {
      console.error('Error finding customer:', error);
      return null;
    }
  }

  static async save(customer: Customer): Promise<boolean> {
    try {
      const customers = await this.getAll();
      const existingIndex = customers.findIndex(c => c.id === customer.id);
      
      if (existingIndex >= 0) {
        customers[existingIndex] = customer;
      } else {
        customers.push(customer);
      }
      
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      return true;
    } catch (error) {
      console.error('Error saving customer:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const customers = await this.getAll();
      const filteredCustomers = customers.filter(c => c.id !== id);
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filteredCustomers));
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // ========== Business Logic ==========

  static async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getAll();
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phone.toLowerCase().includes(lowerQuery)
    );
  }

  static async exists(phone: string): Promise<boolean> {
    const customer = await this.getByPhone(phone);
    return customer !== null;
  }

  static isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced
    return phone.length >= 10 && /^\d+$/.test(phone);
  }

  static isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }
}
