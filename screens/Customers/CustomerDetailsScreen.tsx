import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Invoice, InvoiceItem } from '../../models';
import { InvoiceService, AnalyticsService } from '../../services';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';

type RootStackParamList = {
  CustomerDetails: { customerPhone: string };
};

type CustomerDetailsRouteProp = RouteProp<RootStackParamList, 'CustomerDetails'>;

interface ProductPurchase {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export default function CustomerDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<CustomerDetailsRouteProp>();
  const { customerPhone } = route.params;

  const [customerName, setCustomerName] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [productPurchases, setProductPurchases] = useState<ProductPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Analytics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [firstVisit, setFirstVisit] = useState('');
  const [lastVisit, setLastVisit] = useState('');

  useEffect(() => {
    loadCustomerDetails();
  }, [customerPhone]);

  const loadCustomerDetails = async () => {
    setIsLoading(true);
    const allInvoices = await InvoiceService.getAll();
    
    // Filter invoices for this customer
    const customerInvoices = allInvoices.filter(
      inv => inv.customerPhone === customerPhone
    );

    if (customerInvoices.length > 0) {
      setCustomerName(customerInvoices[0].customerName);
      setInvoices(customerInvoices);

      // Calculate analytics
      const revenue = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const profit = customerInvoices.reduce((sum, inv) => sum + inv.profit, 0);
      const avgOrder = revenue / customerInvoices.length;

      setTotalRevenue(revenue);
      setTotalProfit(profit);
      setAverageOrderValue(avgOrder);

      // Sort invoices by date
      const sortedInvoices = [...customerInvoices].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFirstVisit(sortedInvoices[sortedInvoices.length - 1].createdAt);
      setLastVisit(sortedInvoices[0].createdAt);

      // Aggregate product purchases
      const productMap = new Map<string, ProductPurchase>();
      customerInvoices.forEach(invoice => {
        invoice.items.forEach(item => {
          const existing = productMap.get(item.productName);
          const itemProfit = (item.price - item.costPrice) * item.quantity;
          
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.total;
            existing.profit += itemProfit;
          } else {
            productMap.set(item.productName, {
              name: item.productName,
              quantity: item.quantity,
              revenue: item.total,
              profit: itemProfit,
            });
          }
        });
      });

      const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
      setProductPurchases(products);
    }

    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return AnalyticsService.formatCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return AnalyticsService.formatDateTime(dateString);
  };

  const formatDateShort = (dateString: string) => {
    return AnalyticsService.formatDate(dateString);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const html = generateInvoiceHTML(invoice);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'Invoice generated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invoice');
      console.error('Invoice generation error:', error);
    }
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice #${invoice.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await InvoiceService.delete(invoice.id);
            if (success) {
              loadCustomerDetails();
            } else {
              Alert.alert('Error', 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const generateInvoiceHTML = (invoice: Invoice) => {
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            .totals { margin-top: 20px; text-align: right; }
            .totals div { margin: 5px 0; }
            .total-amount { font-size: 18px; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p>Invoice #${invoice.invoiceNumber}</p>
            <p>${formatDate(invoice.createdAt)}</p>
          </div>
          
          <div class="invoice-details">
            <strong>Customer:</strong> ${invoice.customerName}<br>
            ${invoice.customerPhone ? `<strong>Phone:</strong> ${invoice.customerPhone}<br>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: ${formatCurrency(invoice.subtotal)}</div>
            <div>Tax: ${formatCurrency(invoice.tax)}</div>
            <div class="total-amount">Total: ${formatCurrency(invoice.total)}</div>
          </div>
        </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (invoices.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={mediumScale(24)} />
          </TouchableOpacity>
          <Typography variant="h2">Customer Not Found</Typography>
        </View>
        <EmptyState 
          title="Customer Not Found"
          message="No invoices found for this customer."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={mediumScale(24)} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Typography variant="h2">{customerName}</Typography>
          <Typography variant="caption" color={Colors.textLight}>{customerPhone}</Typography>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Typography variant="h2" style={{ color: Colors.success }}>
              {formatCurrency(totalRevenue)}
            </Typography>
            <Typography variant="caption" color={Colors.textLight}>Total Revenue</Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h2" style={{ color: Colors.primary }}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="caption" color={Colors.textLight}>Total Profit</Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h2">{invoices.length}</Typography>
            <Typography variant="caption" color={Colors.textLight}>Total Orders</Typography>
          </Card>

          <Card style={styles.statCard}>
            <Typography variant="h2">{formatCurrency(averageOrderValue)}</Typography>
            <Typography variant="caption" color={Colors.textLight}>Avg Order Value</Typography>
          </Card>
        </View>

        {/* Visit Info */}
        <Card style={styles.visitCard}>
          <View style={styles.visitRow}>
            <Typography variant="body" color={Colors.textLight}>First Visit</Typography>
            <Typography variant="body">{formatDateShort(firstVisit)}</Typography>
          </View>
          <View style={styles.visitRow}>
            <Typography variant="body" color={Colors.textLight}>Last Visit</Typography>
            <Typography variant="body">{formatDateShort(lastVisit)}</Typography>
          </View>
        </Card>

        {/* Product Purchases */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Product Purchases</Typography>
          {productPurchases.map((product, index) => (
            <Card key={index} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Typography variant="h3">{product.name}</Typography>
                <Typography variant="body" style={{ color: Colors.success }}>
                  {formatCurrency(product.revenue)}
                </Typography>
              </View>
              <View style={styles.productDetails}>
                <View style={styles.productStat}>
                  <Typography variant="caption" color={Colors.textLight}>Quantity</Typography>
                  <Typography variant="body">{product.quantity} units</Typography>
                </View>
                <View style={styles.productStat}>
                  <Typography variant="caption" color={Colors.textLight}>Profit</Typography>
                  <Typography variant="body" style={{ color: Colors.primary }}>
                    {formatCurrency(product.profit)}
                  </Typography>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Invoice History */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Invoice History</Typography>
          {invoices.map((invoice, index) => (
            <Card key={index} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View>
                  <Typography variant="h3">Invoice #{invoice.invoiceNumber}</Typography>
                  <Typography variant="caption" color={Colors.textLight}>
                    {formatDate(invoice.createdAt)}
                  </Typography>
                </View>
                <View style={styles.invoiceActions}>
                  <TouchableOpacity 
                    onPress={() => handleDownloadInvoice(invoice)}
                    style={styles.actionButton}
                  >
                    <Icon name="send" size={mediumScale(20)} style={{ tintColor: Colors.primary }} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteInvoice(invoice)}
                    style={styles.actionButton}
                  >
                    <Icon name="close" size={mediumScale(20)} style={{ tintColor: Colors.danger }} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.invoiceItems}>
                {invoice.items.map((item, idx) => (
                  <View key={idx} style={styles.invoiceItem}>
                    <Typography variant="body">{item.productName}</Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      {item.quantity} × {formatCurrency(item.price)}
                    </Typography>
                  </View>
                ))}
              </View>

              <View style={styles.invoiceTotal}>
                <Typography variant="h3">Total</Typography>
                <Typography variant="h3" color={Colors.success}>
                  {formatCurrency(invoice.total)}
                </Typography>
              </View>
            </Card>
          ))}
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
    paddingTop: Spacing.xl + heightScale(20),
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  visitCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  productCard: {
    marginBottom: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: mediumScale(1),
    borderTopColor: '#E0E0E0',
  },
  productStat: {
    flex: 1,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  invoiceItems: {
    paddingVertical: Spacing.sm,
    borderTopWidth: mediumScale(1),
    borderBottomWidth: mediumScale(1),
    borderColor: '#E0E0E0',
    gap: Spacing.xs,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
