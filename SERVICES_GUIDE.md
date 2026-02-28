# Services Quick Reference

## Common Operations

### Products

```typescript
import { ProductService } from '../services';

// Get all products
const products = await ProductService.getAll();

// Get single product
const product = await ProductService.getById(productId);

// Save product (create or update)
await ProductService.save(product);

// Delete product
await ProductService.delete(productId);

// Search products
const results = await ProductService.searchProducts('laptop');

// Filter by category
const electronics = await ProductService.filterByCategory('Electronics');

// Check stock availability
const available = ProductService.isAvailable(product, 10); // true/false

// Get stock status
const { label, color } = ProductService.getStockStatus(product);
// Returns: { label: 'Low Stock', color: '#FFC107' }

// Record a sale (updates stock + revenue + profit automatically)
await ProductService.recordSale(
  productId,
  quantity: 5,
  sellingPrice: 100,
  costPrice: 60
);

// Get analytics
const lowStock = await ProductService.getLowStockProducts();
const topSellers = await ProductService.getTopSellingProducts(10);
```

### Invoices

```typescript
import { InvoiceService } from '../services';

// Get all invoices  
const invoices = await InvoiceService.getAll();

// Create invoice
const invoice = {
  id: Date.now().toString(),
  invoiceNumber: InvoiceService.generateInvoiceNumber(),
  customerName: 'John Doe',
  customerPhone: '1234567890',
  items: cartItems,
  subtotal: InvoiceService.calculateSubtotal(cartItems),
  tax: InvoiceService.calculateTax(subtotal),
  total: InvoiceService.calculateTotal(subtotal, tax),
  profit: InvoiceService.calculateProfit(cartItems),
  createdAt: new Date().toISOString(),
};
await InvoiceService.save(invoice);

// Delete invoice
await InvoiceService.delete(invoiceId);

// Get customer invoices
const invoices = await InvoiceService.getByCustomerPhone('1234567890');

// Get invoices by date range
const invoices = await InvoiceService.getByDateRange(startDate, endDate);

// Get totals
const totalRevenue = await InvoiceService.getTotalRevenue();
const totalProfit = await InvoiceService.getTotalProfit();
```

### Customers

```typescript
import { CustomerService } from '../services';

// Get all customers
const customers = await CustomerService.getAll();

// Get customer by phone
const customer = await CustomerService.getByPhone('1234567890');

// Save customer
const newCustomer = {
  id: Date.now().toString(),
  name: 'John Doe',
  phone: '1234567890',
  createdAt: new Date().toISOString(),
};
await CustomerService.save(newCustomer);

// Validation
const isValid = CustomerService.isValidPhone('1234567890'); // true/false
const exists = await CustomerService.exists('1234567890'); // true/false

// Search
const results = await CustomerService.searchCustomers('john');
```

### Analytics

```typescript
import { AnalyticsService } from '../services';

// Product analytics
const transactions = await AnalyticsService.getProductTransactions(productId);
// Returns: [{ invoiceNumber, customerName, quantity, price, total, profit, date }, ...]

// Customer analytics
const customerData = await AnalyticsService.getCustomerAnalytics(customers, invoices);
// Returns: [{ name, phone, totalRevenue, totalProfit, visitCount, lastVisit, firstVisit, topProducts }, ...]

const frequency = AnalyticsService.getVisitFrequency(customerData);
// Returns: 'Daily' | 'Weekly' | 'Monthly' | 'Occasional' | 'New Customer'

// Dashboard metrics
const inventoryValue = AnalyticsService.calculateInventoryValue(products);
const totalRevenue = AnalyticsService.calculateTotalRevenue(products);
const totalProfit = AnalyticsService.calculateTotalProfit(products);
const avgMargin = AnalyticsService.calculateAverageProfitMargin(products);

// Stock alerts
const lowStockCount = AnalyticsService.getLowStockCount(products);
const criticalCount = AnalyticsService.getCriticalStockCount(products);
const outOfStockCount = AnalyticsService.getOutOfStockCount(products);

// Formatting
const formatted = AnalyticsService.formatCurrency(12345.67); // "$12345.67"
const date = AnalyticsService.formatDate(dateString); // "Jan 15, 2024"
const dateTime = AnalyticsService.formatDateTime(dateString); // "Jan 15, 2024, 10:30 AM"
```

### Categories

```typescript
import { CategoryService } from '../services';

// Get all categories
const categories = await CategoryService.getAll();

// Add category
await CategoryService.save('New Category');

// Delete category
await CategoryService.delete('Old Category');

// Update category
await CategoryService.update('Old Name', 'New Name');

// Check existence
const exists = CategoryService.exists(categories, 'Electronics'); // true/false
```

### Notifications

```typescript
import { NotificationService } from '../services';

// Setup (call once on app start - works on both iOS and Android)
await NotificationService.setupNotifications();

// Load saved settings
const settings = await NotificationService.loadSettings();
// Returns: NotificationSettings | null

// Save settings
const settingsToSave = {
  enabled: true,
  frequency: 'daily', // 'daily' | 'weekly' | 'monthly' | 'yearly'
  days: ['mon', 'tue', 'wed', 'thu', 'fri'], // for weekly
  time: '9:0', // HH:MM format
  alertTypes: {
    criticalStock: true,
    lowStock: true,
    outOfStock: true,
  },
  monthlyDay: 1, // 1-31 (for monthly)
  yearlyMonth: 1, // 1-12 (for yearly)
  yearlyDay: 1, // 1-31 (for yearly)
};
await NotificationService.saveSettings(settingsToSave);

// Request permissions
const hasPermission = await NotificationService.requestPermissions();
// Shows system dialog, returns true if granted

// Schedule notifications based on settings
await NotificationService.scheduleNotifications(settings);

// Cancel all notifications
await NotificationService.cancelAllNotifications();

// Complete workflow (recommended)
const success = await NotificationService.saveAndSchedule(settingsToSave);
// Handles permissions, saving, canceling old, and scheduling new

// Debug: Get all scheduled notifications
const scheduled = await NotificationService.getScheduledNotifications();
```

## Complete Example: Bill Screen

```typescript
import { ProductService, InvoiceService, CustomerService } from '../services';

const handleCheckout = async () => {
  // 1. Validate stock for all items
  for (const item of cartItems) {
    const product = await ProductService.getById(item.productId);
    if (!ProductService.isAvailable(product, item.quantity)) {
      Alert.alert('Insufficient stock for' + product.name);
      return;
    }
  }

  // 2. Create or find customer
  let customer = await CustomerService.getByPhone(phoneNumber);
  if (!customer) {
    customer = {
      id: Date.now().toString(),
      name: customerName,
      phone: phoneNumber,
      createdAt: new Date().toISOString(),
    };
    await CustomerService.save(customer);
  }

  // 3. Calculate totals
  const subtotal = InvoiceService.calculateSubtotal(cartItems);
  const tax = InvoiceService.calculateTax(subtotal, 0.1);
  const total = InvoiceService.calculateTotal(subtotal, tax);
  const profit = InvoiceService.calculateProfit(cartItems);

  // 4. Create invoice
  const invoice = {
    id: Date.now().toString(),
    invoiceNumber: InvoiceService.generateInvoiceNumber(),
    customerName,
    customerPhone: phoneNumber,
    items: cartItems,
    subtotal,
    tax,
    total,
    profit,
    createdAt: new Date().toISOString(),
  };
  await InvoiceService.save(invoice);

  // 5. Update products (stock, revenue, profit)
  for (const item of cartItems) {
    await ProductService.recordSale(
      item.productId,
      item.quantity,
      item.price,
      item.costPrice
    );
  }

  // 6. Done!
  Alert.alert('Success', 'Invoice created!');
  navigation.goBack();
};
```

## Performance Tips

✅ **DO:**
- Use service methods instead of raw AsyncStorage
- Use `recordSale()` to update products (handles everything)
- Use aggregate data (`product.revenue`) instead of calculating
- Batch operations when possible

❌ **DON'T:**
- Loop through invoices to calculate totals
- Access AsyncStorage directly from screens
- Put business logic in UI components
- Calculate metrics that are already stored

## Error Handling

All service methods handle errors internally and return safe defaults:

```typescript
// Services return empty arrays on error
const products = await ProductService.getAll(); // [] on error

// Services return null for single items
const product = await ProductService.getById('123'); // null on error

// Services return false on operation failure
const success = await ProductService.save(product); // false on error

// Always check results
if (success) {
  Alert.alert('Success');
} else {
  Alert.alert('Error', 'Failed to save product');
}
```
