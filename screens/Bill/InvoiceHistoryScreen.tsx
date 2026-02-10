import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { getInvoices, deleteInvoice, Invoice } from '../../utils/invoiceStorage';

export default function InvoiceHistoryScreen({ navigation }: any) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadInvoices();
    }, [])
  );

  const loadInvoices = async () => {
    const loadedInvoices = await getInvoices();
    setInvoices(loadedInvoices);
  };

  const generateInvoiceHTML = (invoice: Invoice) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #007AFF; margin: 0; }
            .info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: 600; }
            .totals { margin-top: 20px; text-align: right; }
            .totals-row { display: flex; justify-content: flex-end; margin: 5px 0; }
            .totals-row span:first-child { width: 150px; }
            .total { font-size: 18px; font-weight: bold; color: #007AFF; }
            .profit { font-size: 14px; color: #34C759; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QuickStock</h1>
            <p>Invoice: ${invoice.invoiceNumber}</p>
          </div>
          <div class="info">
            <div class="info-row">
              <span><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span><strong>Customer:</strong> ${invoice.customerName}</span>
            </div>
            <div class="info-row">
              <span><strong>Phone:</strong> ${invoice.customerPhone || 'N/A'}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>$${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Tax (10%):</span>
              <span>$${invoice.tax.toFixed(2)}</span>
            </div>
            <div class="totals-row total">
              <span>Total:</span>
              <span>$${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const html = generateInvoiceHTML(invoice);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInvoice(invoice.id);
            await loadInvoices();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Invoice History</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {invoices.length === 0 ? (
          <EmptyState 
            title="No invoices yet" 
            message="Create your first invoice to see it here"
          />
        ) : (
          invoices.map(invoice => (
            <Card key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceLeft}>
                  <Typography variant="body" style={styles.invoiceNumber}>
                    {invoice.invoiceNumber}
                  </Typography>
                  <Typography variant="body" style={styles.customerName}>
                    {invoice.customerName}
                  </Typography>
                  <Typography variant="caption" color={Colors.textLight}>
                    {new Date(invoice.createdAt).toLocaleDateString()} • {new Date(invoice.createdAt).toLocaleTimeString()}
                  </Typography>
                </View>
                <View style={styles.invoiceRight}>
                  <Typography variant="h3" color={Colors.primary}>
                    ${invoice.total.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color={Colors.success} style={styles.profitText}>
                    Profit ${(invoice.profit || 0).toFixed(2)}
                  </Typography>
                </View>
              </View>

              <View style={styles.invoiceActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDownloadPDF(invoice)}
                >
                  <Icon name="send" size={16} color={Colors.primary} />
                  <Typography variant="caption" color={Colors.primary}>Download</Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDeleteInvoice(invoice)}
                >
                  <Icon name="delete-bin" size={16} color={Colors.danger} />
                  <Typography variant="caption" color={Colors.danger}>Delete</Typography>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  backButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  customerName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  profitText: {
    marginTop: 4,
    fontWeight: '600',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
});
