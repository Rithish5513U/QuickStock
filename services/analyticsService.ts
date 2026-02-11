import { Product, Invoice, Customer } from '../models';
import { InvoiceService } from './invoiceService';

/**
 * Analytics Service - Handles all analytics and calculations
 */
export class AnalyticsService {
  // ========== Product Analytics ==========

  static async getProductTransactions(productId: string): Promise<any[]> {
    const invoices = await InvoiceService.getAll();
    const transactions: any[] = [];

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.productId === productId) {
          const itemProfit = (item.price - item.costPrice) * item.quantity;
          transactions.push({
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            profit: itemProfit,
            date: invoice.createdAt,
          });
        }
      });
    });

    return transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // ========== Customer Analytics ==========

  static async getCustomerAnalytics(customers: Customer[], invoices: Invoice[]): Promise<any[]> {
    const customerMap = new Map<string, any>();

    invoices.forEach(invoice => {
      const phone = invoice.customerPhone || 'unknown';
      const existing = customerMap.get(phone);

      const productCounts = new Map<string, number>();
      invoice.items.forEach(item => {
        const currentCount = productCounts.get(item.productName) || 0;
        productCounts.set(item.productName, currentCount + item.quantity);
      });

      if (existing) {
        existing.totalRevenue += invoice.total;
        existing.totalProfit += invoice.profit;
        existing.visitCount += 1;
        existing.invoiceIds.push(invoice.id);
        
        if (new Date(invoice.createdAt) > new Date(existing.lastVisit)) {
          existing.lastVisit = invoice.createdAt;
        }
        
        if (new Date(invoice.createdAt) < new Date(existing.firstVisit)) {
          existing.firstVisit = invoice.createdAt;
        }

        productCounts.forEach((quantity, productName) => {
          const existingProduct = existing.topProducts.find((p: any) => p.name === productName);
          if (existingProduct) {
            existingProduct.quantity += quantity;
          } else {
            existing.topProducts.push({ name: productName, quantity });
          }
        });

        existing.topProducts.sort((a: any, b: any) => b.quantity - a.quantity);
        existing.topProducts = existing.topProducts.slice(0, 5);
      } else {
        const topProducts = Array.from(productCounts.entries())
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        customerMap.set(phone, {
          name: invoice.customerName,
          phone: phone,
          totalRevenue: invoice.total,
          totalProfit: invoice.profit,
          visitCount: 1,
          lastVisit: invoice.createdAt,
          firstVisit: invoice.createdAt,
          topProducts,
          invoiceIds: [invoice.id],
        });
      }
    });

    return Array.from(customerMap.values());
  }

  static getVisitFrequency(customerData: {
    visitCount: number;
    firstVisit: string;
  }): string {
    const daysSinceFirst = Math.floor(
      (new Date().getTime() - new Date(customerData.firstVisit).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceFirst === 0) return 'New Customer';
    
    const visitsPerDay = customerData.visitCount / daysSinceFirst;
    
    if (visitsPerDay >= 1) return 'Daily';
    if (visitsPerDay >= 0.25) return 'Weekly';
    if (visitsPerDay >= 0.1) return 'Monthly';
    return 'Occasional';
  }

  // ========== Dashboard Analytics ==========

  static calculateInventoryValue(products: Product[]): number {
    return products.reduce((sum, p) => sum + (p.currentStock * p.buyingPrice), 0);
  }

  static calculateTotalRevenue(products: Product[]): number {
    return products.reduce((sum, p) => sum + (p.revenue || 0), 0);
  }

  static calculateTotalProfit(products: Product[]): number {
    return products.reduce((sum, p) => sum + (p.profit || 0), 0);
  }

  static calculateAverageProfitMargin(products: Product[]): number {
    const totalRevenue = this.calculateTotalRevenue(products);
    const totalProfit = this.calculateTotalProfit(products);
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }

  static getLowStockCount(products: Product[]): number {
    return products.filter(p => 
      p.currentStock <= p.minStock && p.currentStock > p.criticalStock
    ).length;
  }

  static getCriticalStockCount(products: Product[]): number {
    return products.filter(p => p.currentStock <= p.criticalStock).length;
  }

  static getOutOfStockCount(products: Product[]): number {
    return products.filter(p => p.currentStock === 0).length;
  }

  // ========== Utility Methods ==========

  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  static formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
