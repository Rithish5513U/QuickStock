import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { getProductById, Product } from '../../utils/storage';
import { getInvoices, Invoice, InvoiceItem } from '../../utils/invoiceStorage';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type RootStackParamList = {
  ProductAnalytics: { productId: string };
};

type ProductAnalyticsRouteProp = RouteProp<RootStackParamList, 'ProductAnalytics'>;

interface TransactionRecord {
  invoiceNumber: string;
  customerName: string;
  quantity: number;
  price: number;
  total: number;
  profit: number;
  date: string;
}

export default function ProductAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<ProductAnalyticsRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Analytics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalQuantitySold, setTotalQuantitySold] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    loadProductAnalytics();
  }, [productId]);

  const loadProductAnalytics = async () => {
    setIsLoading(true);
    
    // Load product
    const loadedProduct = await getProductById(productId);
    setProduct(loadedProduct);

    // Load all invoices
    const allInvoices = await getInvoices();
    
    // Filter transactions for this product
    const productTransactions: TransactionRecord[] = [];
    let revenue = 0;
    let profit = 0;
    let quantitySold = 0;

    allInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (item.productId === productId) {
          const itemProfit = (item.price - item.costPrice) * item.quantity;
          productTransactions.push({
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            profit: itemProfit,
            date: invoice.createdAt,
          });
          revenue += item.total;
          profit += itemProfit;
          quantitySold += item.quantity;
        }
      });
    });

    // Sort by date (newest first)
    productTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(productTransactions);
    setTotalRevenue(revenue);
    setTotalProfit(profit);
    setTotalQuantitySold(quantitySold);
    setTotalTransactions(productTransactions.length);
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = () => {
    if (!product) return { label: 'Unknown', color: Colors.textLight };
    if (product.currentStock <= product.criticalStock) {
      return { label: 'Critical', color: Colors.danger };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Low Stock', color: Colors.warning };
    }
    return { label: 'In Stock', color: Colors.success };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} />
          </TouchableOpacity>
          <Typography variant="h2">Product Not Found</Typography>
        </View>
        <EmptyState 
          title="Product Not Found"
          message="This product does not exist."
        />
      </View>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography variant="h2">Product Analytics</Typography>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <Card style={styles.productCard}>
          <Typography variant="h3" style={styles.productName}>{product.name}</Typography>
          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Category</Typography>
              <Typography variant="body">{product.category}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>SKU</Typography>
              <Typography variant="body">{product.sku || 'N/A'}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Barcode</Typography>
              <Typography variant="body">{product.barcode || 'N/A'}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Buying Price</Typography>
              <Typography variant="body">{formatCurrency(product.buyingPrice)}</Typography>
            </View>
            <View style={styles.detailRow}>
              <Typography variant="body" color={Colors.textLight}>Selling Price</Typography>
              <Typography variant="body">{formatCurrency(product.sellingPrice)}</Typography>
            </View>
          </View>
        </Card>

        {/* Stock & Performance Card */}
        <Card style={styles.stockPerformanceCard}>
          <Typography variant="h3" style={styles.sectionTitle}>Stock & Performance</Typography>
          <View style={styles.stockGrid}>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Current Stock</Typography>
              <View style={styles.stockValueRow}>
                <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color }]} />
                <Typography variant="h3">{product.currentStock}</Typography>
              </View>
            </View>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Sold Units</Typography>
              <Typography variant="h3" style={{ color: Colors.success }}>
                {product.soldUnits || 0}
              </Typography>
            </View>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Min Stock</Typography>
              <Typography variant="h3" style={{ color: Colors.warning }}>
                {product.minStock}
              </Typography>
            </View>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Critical Stock</Typography>
              <Typography variant="h3" style={{ color: Colors.danger }}>
                {product.criticalStock}
              </Typography>
            </View>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Revenue</Typography>
              <Typography variant="h3" style={{ color: Colors.success }}>
                {formatCurrency(totalRevenue)}
              </Typography>
            </View>
            <View style={styles.stockItem}>
              <Typography variant="body" color={Colors.textLight}>Profit</Typography>
              <Typography variant="h3" style={{ color: Colors.primary }}>
                {formatCurrency(totalProfit)}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Analytics Overview */}
        <View style={styles.analyticsGrid}>
          <Card style={styles.statCard}>
            <Typography variant="h1" style={styles.statValue}>
              {formatCurrency(totalRevenue)}
            </Typography>
            <Typography variant="body" color={Colors.textLight} style={styles.statLabel}>
              Total Revenue
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h1" color={Colors.success} style={styles.statValue}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="body" color={Colors.textLight} style={styles.statLabel}>
              Total Profit
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h1" style={styles.statValue}>
              {totalQuantitySold}
            </Typography>
            <Typography variant="body" color={Colors.textLight} style={styles.statLabel}>
              Units Sold
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h1" style={styles.statValue}>
              {totalTransactions}
            </Typography>
            <Typography variant="body" color={Colors.textLight} style={styles.statLabel}>
              Transactions
            </Typography>
          </Card>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Transaction History</Typography>
          
          {transactions.length === 0 ? (
            <EmptyState 
              title="No Transactions"
              message="This product hasn't been sold yet."
            />
          ) : (
            transactions.map((transaction, index) => (
              <Card key={index} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View>
                    <Typography variant="h3">{transaction.customerName}</Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      Invoice #{transaction.invoiceNumber}
                    </Typography>
                  </View>
                  <Typography variant="body" color={Colors.textLight}>
                    {formatDate(transaction.date)}
                  </Typography>
                </View>
                
                <View style={styles.transactionDetails}>
                  <View style={styles.transactionRow}>
                    <Typography variant="body" color={Colors.textLight}>Quantity</Typography>
                    <Typography variant="body">{transaction.quantity} units</Typography>
                  </View>
                  <View style={styles.transactionRow}>
                    <Typography variant="body" color={Colors.textLight}>Unit Price</Typography>
                    <Typography variant="body">{formatCurrency(transaction.price)}</Typography>
                  </View>
                  <View style={styles.transactionRow}>
                    <Typography variant="body" color={Colors.textLight}>Total</Typography>
                    <Typography variant="h3">{formatCurrency(transaction.total)}</Typography>
                  </View>
                  <View style={styles.transactionRow}>
                    <Typography variant="body" color={Colors.textLight}>Profit</Typography>
                    <Typography variant="body" style={{ color: Colors.success }}>
                      {formatCurrency(transaction.profit)}
                    </Typography>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  productCard: {
    margin: Spacing.md,
  },
  productName: {
    marginBottom: Spacing.md,
  },
  productDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockPerformanceCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  stockItem: {
    flex: 1,
    minWidth: '45%',
    gap: Spacing.xs,
  },
  stockValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  transactionCard: {
    marginBottom: Spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  transactionDetails: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
