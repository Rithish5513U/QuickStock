import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { getProducts, saveProduct, Product } from '../../utils/storage';
import { getInvoices, saveInvoice, deleteInvoice, Invoice, InvoiceItem } from '../../utils/invoiceStorage';
import { getCustomers, saveCustomer, Customer } from '../../utils/customerStorage';

export default function BillScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [scannedItems, setScannedItems] = useState<Map<string, number>>(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [scanned, setScanned] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const loadedProducts = await getProducts();
    const loadedInvoices = await getInvoices();
    const loadedCustomers = await getCustomers();
    setProducts(loadedProducts);
    setInvoices(loadedInvoices);
    setCustomers(loadedCustomers);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const product = products.find(p => p.barcode === data || p.sku === data);
    if (product) {
      if (product.currentStock > 0) {
        const currentQty = scannedItems.get(product.id) || 0;
        if (currentQty < product.currentStock) {
          const newItems = new Map(scannedItems);
          newItems.set(product.id, currentQty + 1);
          setScannedItems(newItems);
          Alert.alert('Added', `${product.name} added`);
        } else {
          Alert.alert('Out of Stock', `Only ${product.currentStock} available`);
        }
      } else {
        Alert.alert('Out of Stock', `${product.name} is out of stock`);
      }
    } else {
      Alert.alert('Not Found', 'Product not found');
    }

    setTimeout(() => setScanned(false), 2000);
  };

  const handleRemoveItem = (productId: string) => {
    const newItems = new Map(scannedItems);
    newItems.delete(productId);
    setScannedItems(newItems);
  };

  const handleQuantityChange = (productId: string, qty: string) => {
    const quantity = parseInt(qty) || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.currentStock) {
      Alert.alert('Invalid', `Only ${product.currentStock} available`);
      return;
    }

    const newItems = new Map(scannedItems);
    if (quantity > 0) {
      newItems.set(productId, quantity);
    } else {
      newItems.delete(productId);
    }
    setScannedItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    scannedItems.forEach((qty, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const price = product.sellingPrice || product.price;
        subtotal += price * qty;
      }
    });
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      createdAt: new Date().toISOString(),
    };

    await saveCustomer(customer);
    setNewCustomerName('');
    setNewCustomerPhone('');
    await loadData();
    await createInvoice(customer);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setShowCustomerModal(false);
    await createInvoice(customer);
  };

  const createInvoice = async (customer: Customer) => {
    const items: InvoiceItem[] = [];
    const productsToUpdate: Product[] = [];

    scannedItems.forEach((qty, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const price = product.sellingPrice || product.price;
        items.push({
          productId: product.id,
          productName: product.name,
          quantity: qty,
          price,
          total: price * qty,
        });
        productsToUpdate.push({
          ...product,
          currentStock: product.currentStock - qty,
        });
      }
    });

    const { subtotal, tax, total } = calculateTotals();

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${Date.now()}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
    };

    const success = await saveInvoice(invoice);
    if (success) {
      for (const product of productsToUpdate) {
        await saveProduct(product);
      }
      setCurrentInvoice(invoice);
      setShowInvoicePreview(true);
      setScannedItems(new Map());
      await loadData();
    }
  };

  const generatePDF = async (invoice: Invoice) => {
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
              <span><strong>Phone:</strong> ${invoice.customerPhone}</span>
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
                  <td>₹${item.price.toFixed(2)}</td>
                  <td>₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>Tax (10%):</span>
              <span>₹${invoice.tax.toFixed(2)}</span>
            </div>
            <div class="totals-row total">
              <span>Total:</span>
              <span>₹${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInvoice(invoice.id);
            await loadData();
          },
        },
      ]
    );
  };

  const itemsList = Array.from(scannedItems.entries()).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return product ? { ...product, qty } : null;
  }).filter(Boolean);

  const { subtotal, tax, total } = calculateTotals();

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">Invoice</Typography>
        <TouchableOpacity onPress={() => setShowHistoryModal(true)}>
          <Icon name="inbox" size={24} />
        </TouchableOpacity>
      </View>

      <Card style={styles.scannerCard}>
        <Typography variant="h3" style={styles.sectionTitle}>Scan Product Barcode</Typography>
        {!showScanner ? (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => {
              if (!permission?.granted) {
                requestPermission();
              } else {
                setShowScanner(true);
              }
            }}
          >
            <Icon name="camera" size={40} color={Colors.primary} />
            <Typography variant="body" color={Colors.primary} style={{ marginTop: Spacing.sm, fontWeight: '600' }}>
              Tap to Scan
            </Typography>
          </TouchableOpacity>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
              }}
            />
            <TouchableOpacity
              style={styles.closeScanner}
              onPress={() => {
                setShowScanner(false);
                setScanned(false);
              }}
            >
              <Icon name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </Card>

      <ScrollView style={styles.scrollView}>
        {itemsList.length > 0 && (
          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>Scanned Items ({itemsList.length})</Typography>
            {itemsList.map((item: any) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemLeft}>
                  <Typography variant="body" style={styles.itemName}>{item.name}</Typography>
                  <Typography variant="caption" color={Colors.textLight}>
                    ₹{(item.sellingPrice || item.price).toFixed(2)} × {item.qty}
                  </Typography>
                </View>
                <View style={styles.itemRight}>
                  <TextInput
                    style={styles.qtyInput}
                    value={item.qty.toString()}
                    onChangeText={(qty) => handleQuantityChange(item.id, qty)}
                    keyboardType="number-pad"
                  />
                  <Typography variant="body" style={styles.itemTotal}>
                    ₹{((item.sellingPrice || item.price) * item.qty).toFixed(2)}
                  </Typography>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <Icon name="delete-bin" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Typography variant="body">Subtotal</Typography>
                <Typography variant="body">₹{subtotal.toFixed(2)}</Typography>
              </View>
              <View style={styles.summaryRow}>
                <Typography variant="body">Tax (10%)</Typography>
                <Typography variant="body">₹{tax.toFixed(2)}</Typography>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Typography variant="h3">Total</Typography>
                <Typography variant="h3" color={Colors.primary}>₹{total.toFixed(2)}</Typography>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {itemsList.length > 0 && (
        <View style={styles.footer}>
          <Button title="Create Invoice Manually" onPress={() => setShowCustomerModal(true)} />
        </View>
      )}

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Select Customer</Typography>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Card style={styles.newCustomerSection}>
                <Typography variant="body" style={styles.sectionTitle}>Create New Customer</Typography>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  value={newCustomerPhone}
                  onChangeText={setNewCustomerPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textLight}
                />
                <Button title="Create & Continue" onPress={handleCreateCustomer} />
              </Card>

              {customers.length > 0 && (
                <>
                  <Typography variant="body" style={styles.orText}>Or Select Existing</Typography>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                    placeholderTextColor={Colors.textLight}
                  />
                  {filteredCustomers.map(customer => (
                    <TouchableOpacity
                      key={customer.id}
                      style={styles.customerItem}
                      onPress={() => handleSelectCustomer(customer)}
                    >
                      <View>
                        <Typography variant="body" style={styles.customerName}>{customer.name}</Typography>
                        <Typography variant="caption" color={Colors.textLight}>{customer.phone}</Typography>
                      </View>
                      <Icon name="arrow-right" size={20} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invoice Preview */}
      <Modal visible={showInvoicePreview} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Invoice</Typography>
              <TouchableOpacity onPress={() => setShowInvoicePreview(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            {currentInvoice && (
              <ScrollView style={styles.modalBody}>
                <Card>
                  <Typography variant="h2" color={Colors.primary} style={{ textAlign: 'center' }}>
                    QuickStock
                  </Typography>
                  <Typography variant="caption" color={Colors.textLight} style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
                    {currentInvoice.invoiceNumber}
                  </Typography>

                  <View style={styles.invoiceInfo}>
                    <View style={styles.infoRow}>
                      <Typography variant="body" style={{ fontWeight: '600' }}>Date:</Typography>
                      <Typography variant="body">{new Date(currentInvoice.createdAt).toLocaleDateString()}</Typography>
                    </View>
                    <View style={styles.infoRow}>
                      <Typography variant="body" style={{ fontWeight: '600' }}>Customer:</Typography>
                      <Typography variant="body">{currentInvoice.customerName}</Typography>
                    </View>
                    <View style={styles.infoRow}>
                      <Typography variant="body" style={{ fontWeight: '600' }}>Phone:</Typography>
                      <Typography variant="body">{currentInvoice.customerPhone}</Typography>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {currentInvoice.items.map((item, i) => (
                    <View key={i} style={styles.invoiceItem}>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" style={{ fontWeight: '600' }}>{item.productName}</Typography>
                        <Typography variant="caption" color={Colors.textLight}>
                          ₹{item.price.toFixed(2)} × {item.quantity}
                        </Typography>
                      </View>
                      <Typography variant="body">₹{item.total.toFixed(2)}</Typography>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                      <Typography variant="body">Subtotal:</Typography>
                      <Typography variant="body">₹{currentInvoice.subtotal.toFixed(2)}</Typography>
                    </View>
                    <View style={styles.summaryRow}>
                      <Typography variant="body">Tax (10%):</Typography>
                      <Typography variant="body">₹{currentInvoice.tax.toFixed(2)}</Typography>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Typography variant="h3">Total:</Typography>
                      <Typography variant="h3" color={Colors.primary}>₹{currentInvoice.total.toFixed(2)}</Typography>
                    </View>
                  </View>
                </Card>

                <Button
                  title="Download PDF"
                  onPress={() => generatePDF(currentInvoice)}
                  style={{ marginTop: Spacing.lg }}
                />
                <Button
                  title="Done"
                  variant="outline"
                  onPress={() => {
                    setShowInvoicePreview(false);
                    setCurrentInvoice(null);
                  }}
                  style={{ marginTop: Spacing.md }}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* History */}
      <Modal visible={showHistoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Invoice History</Typography>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {invoices.length === 0 ? (
                <EmptyState title="No invoices" message="Create your first invoice" />
              ) : (
                invoices.map(inv => (
                  <Card key={inv.id} style={{ marginBottom: Spacing.md }}>
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentInvoice(inv);
                        setShowHistoryModal(false);
                        setShowInvoicePreview(true);
                      }}
                    >
                      <View style={styles.invoiceHeader}>
                        <View>
                          <Typography variant="body" style={{ fontWeight: '600' }}>{inv.invoiceNumber}</Typography>
                          <Typography variant="caption" color={Colors.textLight}>{inv.customerName}</Typography>
                          <Typography variant="caption" color={Colors.textLight}>
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </Typography>
                        </View>
                        <Typography variant="h3" color={Colors.primary}>₹{inv.total.toFixed(2)}</Typography>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.invoiceActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => generatePDF(inv)}
                      >
                        <Icon name="send" size={16} color={Colors.primary} />
                        <Typography variant="caption" color={Colors.primary}>PDF</Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeleteInvoice(inv)}
                      >
                        <Icon name="delete-bin" size={16} color={Colors.danger} />
                        <Typography variant="caption" color={Colors.danger}>Delete</Typography>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  },
  scrollView: {
    flex: 1,
  },
  scannerCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  scanButton: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  cameraContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  closeScanner: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: Spacing.sm,
  },
  section: {
    margin: Spacing.lg,
    marginTop: 0,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyInput: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    padding: Spacing.xs,
    width: 50,
    textAlign: 'center',
  },
  itemTotal: {
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.background,
    marginVertical: Spacing.md,
  },
  summary: {
    marginTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  newCustomerSection: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  orText: {
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  customerName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  invoiceInfo: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
