# Inventory Management System - Architecture Documentation

## Overview
This project follows a clean architecture pattern with **complete separation of concerns** between data models, business logic, and UI components.

## Architecture Layers

### 📦 Models (`/models`)
Pure data interfaces with no logic. Define the structure of entities in the system.

**Files:**
- `Product.ts` - Product entity (19 fields including stock, pricing, revenue, profit)
- `Invoice.ts` - Invoice and InvoiceItem entities
- `Customer.ts` - Customer entity
- `index.ts` - Barrel export for all models

**Usage:**
```typescript
import { Product, Invoice, Customer } from '../models';
```

### 🔧 Services (`/services`)
Business logic layer. All data operations and calculations happen here.

#### ProductService
Manages all product-related operations:
- **CRUD:** `getAll()`, `getById()`, `save()`, `delete()`
- **Business Logic:**
  - `updateStock(productId, quantity, operation)` - Add or remove stock
  - `recordSale(productId, quantity, sellingPrice, costPrice)` - Record a sale with automatic stock update
  - `getStockStatus(product)` - Get stock status (Critical/Low/In Stock) with color codes
  - `isAvailable(product, quantity)` - Check if product has enough stock
  - `calculateProfitMargin(product)` - Calculate profit margin percentage
- **Queries:**
  - `searchProducts(query)` - Search by name, category, SKU, or barcode
  - `getByBarcode(barcode)` - Find product by barcode or SKU
  - `filterByCategory(category)` - Filter products by category
  - `sortProducts(products, sortBy)` - Sort by name, price, or stock
  - `getLowStockProducts()` - Get products below minimum stock
  - `getCriticalStockProducts()` - Get products below critical stock
  - `getTopSellingProducts(limit)` - Get best-selling products

#### CategoryService
Manages product categories:
- `getAll()` - Get all categories
- `save(category)` - Add new category
- `delete(category)` - Remove category
- `update(oldCategory, newCategory)` - Rename category
- `exists(categories, category)` - Check if category exists

#### InvoiceService
Manages invoices and calculations:
- **CRUD:** `getAll()`, `save()`, `delete()`
- **Calculations:**
  - `generateInvoiceNumber()` - Generate unique invoice number
  - `calculateSubtotal(items)` - Calculate items subtotal
  - `calculateTax(subtotal, taxRate)` - Calculate tax amount
  - `calculateTotal(subtotal, tax)` - Calculate final total
  - `calculateProfit(items)` - Calculate profit from items
- **Queries:**
  - `getByCustomerPhone(phone)` - Get all invoices for a customer
  - `getByDateRange(startDate, endDate)` - Get invoices in date range
  - `getTotalRevenue()` - Get total revenue from all invoices
  - `getTotalProfit()` - Get total profit from all invoices
  - `getRevenueByProduct(productId)` - Get revenue for specific product
  - `getProfitByProduct(productId)` - Get profit for specific product

#### CustomerService
Manages customer data:
- **CRUD:** `getAll()`, `getById()`, `getByPhone()`, `save()`, `delete()`
- **Validation:**
  - `isValidPhone(phone)` - Validate phone number format
  - `isValidName(name)` - Validate customer name
  - `exists(phone)` - Check if customer exists
- **Queries:**
  - `searchCustomers(query)` - Search by name or phone

#### AnalyticsService
Handles all analytics and reporting:
- **Product Analytics:**
  - `getProductTransactions(productId)` - Get all transactions for a product
- **Customer Analytics:**
  - `getCustomerAnalytics(customers, invoices)` - Calculate customer metrics
  - `getVisitFrequency(customerData)` - Determine visit frequency (Daily/Weekly/Monthly)
- **Dashboard Analytics:**
  - `calculateInventoryValue(products)` - Total inventory value at cost
  - `calculateTotalRevenue(products)` - Total revenue from all products
  - `calculateTotalProfit(products)` - Total profit from all products
  - `calculateAverageProfitMargin(products)` - Average profit margin %
  - `getLowStockCount(products)` - Count of low stock items
  - `getCriticalStockCount(products)` - Count of critical stock items
  - `getOutOfStockCount(products)` - Count of out of stock items
- **Utilities:**
  - `formatCurrency(amount)` - Format number as currency ($123.45)
  - `formatDate(dateString)` - Format date (Jan 15, 2024)
  - `formatDateTime(dateString)` - Format date with time

**Usage:**
```typescript
import { ProductService, InvoiceService, AnalyticsService } from '../services';

// Get all products
const products = await ProductService.getAll();

// Record a sale
await ProductService.recordSale(productId, quantity, sellingPrice, costPrice);

// Get analytics
const transactions = await AnalyticsService.getProductTransactions(productId);
```

### 🎨 Screens (`/screens`)
UI layer - only responsible for rendering and user interaction. All logic is delegated to services.

**Best Practices:**
- Import services at the top: `import { ProductService } from '../services';`
- Use services for all data operations: `const products = await ProductService.getAll();`
- Keep screens focused on UI state and rendering
- No business logic calculations in screens
- Handle loading states and errors gracefully

### 🛠️ Utils (`/utils`)
Legacy storage utilities. **Deprecated** - use services instead.

- `storage.ts` - Direct AsyncStorage access (use `ProductService` instead)
- `invoiceStorage.ts` - Invoice storage (use `InvoiceService` instead)
- `customerStorage.ts` - Customer storage (use `CustomerService` instead)

**Note:** These files now re-export models for backward compatibility but will be removed in future.

## Data Flow

```
User Action (Screen)
    ↓
Service Layer (Business Logic)
    ↓
AsyncStorage (Data Persistence)
    ↓
Models (Data Structure)
```

## Performance Optimizations

### Aggregate Data Pattern
Instead of calculating metrics at read-time (slow), we store them at write-time (fast).

**Example: Product Revenue & Profit**
❌ **Old Way (O(n) - Slow):**
```typescript
// Loop through all invoices every time
const revenue = invoices
  .filter(inv => inv.productId === productId)
  .reduce((sum, inv) => sum + inv.total, 0);
```

✅ **New Way (O(1) - Fast):**
```typescript
// Stored in product, updated on each sale
product.revenue // Already calculated!
product.profit // Already calculated!
```

**Updated on Every Sale:**
```typescript
await ProductService.recordSale(productId, quantity, sellingPrice, costPrice);
// Automatically updates: currentStock, soldUnits, revenue, profit
```

### Benefits
- ✅ Instant analytics (no loops)
- ✅ Scales with many invoices
- ✅ Single source of truth
- ✅ Consistent data

## Example: Converting a Screen

### Before (UI with Business Logic)
```typescript
// ❌ Business logic mixed with UI
const loadProducts = async () => {
  const data = await AsyncStorage.getItem('@products');
  const products = JSON.parse(data);
  const lowStock = products.filter(p => p.stock < p.minStock);
  setLowStock(lowStock);
};
```

### After (Clean Separation)
```typescript
// ✅ UI delegates to service
const loadProducts = async () => {
  const lowStock = await ProductService.getLowStockProducts();
  setLowStock(lowStock);
};
```

## Migration Guide

### Step 1: Update Imports
```typescript
// Old
import { Product } from '../utils/storage';
import { getProducts } from '../utils/storage';

// New
import { Product } from '../models';
import { ProductService } from '../services';
```

### Step 2: Replace Direct Storage Calls
```typescript
// Old
const products = await getProducts();

// New
const products = await ProductService.getAll();
```

### Step 3: Use Service Methods for Logic
```typescript
// Old - Calculate in UI
const lowStock = products.filter(p => p.stock < p.minStock);

// New - Use service
const lowStock = await ProductService.getLowStockProducts();
```

## Testing Best Practices

Services are designed to be easily testable:

```typescript
// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage');

// Test service methods in isolation
describe('ProductService', () => {
  it('should calculate profit margin', () => {
    const product = {
      buyingPrice: 50,
      sellingPrice: 100,
    };
    const margin = ProductService.calculateProfitMargin(product);
    expect(margin).toBe(50);
  });
});
```

## Future Enhancements

- [ ] Add TypeScript strict mode
- [ ] Implement caching layer in services
- [ ] Add validation service for form inputs
- [ ] Create report generation service
- [ ] Add data export/import service
- [ ] Implement offline-first sync strategy
- [ ] Add unit tests for all services
- [ ] Add integration tests for screens

## Contributing

When adding new features:
1. Define data structure in `/models`
2. Implement business logic in `/services`
3. Use services in UI `/screens`
4. Keep layers independent and testable

---

**Last Updated:** January 2024  
**Architecture Pattern:** Clean Architecture with Service Layer  
**State Management:** React Hooks (useState, useEffect)  
**Data Persistence:** AsyncStorage  
**Performance Strategy:** Aggregate Data at Write-Time
