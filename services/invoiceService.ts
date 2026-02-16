import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice } from '../models';

const INVOICES_KEY = '@inventory_invoices';

/**
 * Invoice Service - Handles all invoice-related business logic
 */
export class InvoiceService {
  // ========== CRUD Operations ==========

  static async getAll(): Promise<Invoice[]> {
    try {
      const data = await AsyncStorage.getItem(INVOICES_KEY);
      const invoices = data ? JSON.parse(data) : [];
      return invoices.sort((a: Invoice, b: Invoice) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading invoices:', error);
      return [];
    }
  }

  static async save(invoice: Invoice): Promise<boolean> {
    try {
      const invoices = await this.getAll();
      invoices.push(invoice);
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
      return true;
    } catch (error) {
      console.error('Error saving invoice:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const invoices = await this.getAll();
      const filteredInvoices = invoices.filter(inv => inv.id !== id);
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(filteredInvoices));
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  // ========== Business Logic ==========

  static generateInvoiceNumber(): string {
    return `INV-${Date.now()}`;
  }

  static calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  static calculateTax(subtotal: number, taxRate: number = 0.1): number {
    return subtotal * taxRate;
  }

  static calculateTotal(subtotal: number, tax: number): number {
    return subtotal + tax;
  }

  static calculateProfit(items: Array<{ price: number; costPrice: number; quantity: number }>): number {
    return items.reduce((sum, item) => 
      sum + ((item.price - item.costPrice) * item.quantity), 0
    );
  }

  static async getByCustomerPhone(phone: string): Promise<Invoice[]> {
    const invoices = await this.getAll();
    return invoices.filter(inv => inv.customerPhone === phone);
  }

  static async getByDateRange(startDate: Date, endDate: Date): Promise<Invoice[]> {
    const invoices = await this.getAll();
    return invoices.filter(inv => {
      const invoiceDate = new Date(inv.createdAt);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }

  static async getTotalRevenue(): Promise<number> {
    const invoices = await this.getAll();
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }

  static async getTotalProfit(): Promise<number> {
    const invoices = await this.getAll();
    return invoices.reduce((sum, inv) => sum + inv.profit, 0);
  }

  static async getRevenueByProduct(productId: string): Promise<number> {
    const invoices = await this.getAll();
    let revenue = 0;
    
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.productId === productId) {
          revenue += item.total;
        }
      });
    });
    
    return revenue;
  }

  static async getProfitByProduct(productId: string): Promise<number> {
    const invoices = await this.getAll();
    let profit = 0;
    
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.productId === productId) {
          profit += (item.price - item.costPrice) * item.quantity;
        }
      });
    });
    
    return profit;
  }

  /**
   * Clear all invoices from storage
   */
  static async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(INVOICES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing invoices:', error);
      return false;
    }
  }
}
