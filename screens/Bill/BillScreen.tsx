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
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';
import { Product, Invoice, InvoiceItem, Customer } from '../../models';
import { ProductService, InvoiceService, CustomerService } from '../../services';

export default function BillScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [scannedItems, setScannedItems] = useState<Map<string, number>>(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [scanned, setScanned] = useState(false);
  const [customerStep, setCustomerStep] = useState<'phone' | 'name'>('phone');

  const loadData = async () => {
    const loadedProducts = await ProductService.getAll();
    const loadedCustomers = await CustomerService.getAll();
    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
  };

  // Load data on component mount
  React.useEffect(() => {
    loadData();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const product = products.find(p => p.barcode === data || p.sku === data);
    if (product) {
      if (product.currentStock > 0) {
        setScannedItems(prevItems => {
          const currentQty = prevItems.get(product.id) || 0;
          if (currentQty < product.currentStock) {
            const newItems = new Map(prevItems);
            newItems.set(product.id, currentQty + 1);
            Alert.alert('Added', `${product.name} added`);
            return newItems;
          } else {
            Alert.alert('Out of Stock', `Only ${product.currentStock} available`);
            return prevItems;
          }
        });
      } else {
        Alert.alert('Out of Stock', `${product.name} is out of stock`);
      }
    } else {
      Alert.alert('Not Found', 'Product not found');
    }

    setTimeout(() => setScanned(false), 2000);
  };

  const handleRemoveItem = (productId: string) => {
    setScannedItems(prevItems => {
      const newItems = new Map(prevItems);
      newItems.delete(productId);
      return newItems;
    });
  };

  const handleIncrementItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setScannedItems(prevItems => {
      const currentQty = prevItems.get(productId) || 0;
      if (currentQty < product.currentStock) {
        const newItems = new Map(prevItems);
        newItems.set(productId, currentQty + 1);
        return newItems;
      } else {
        Alert.alert('Out of Stock', `Only ${product.currentStock} available`);
        return prevItems;
      }
    });
  };

  const handleDecrementItem = (productId: string) => {
    setScannedItems(prevItems => {
      const currentQty = prevItems.get(productId) || 0;
      if (currentQty > 1) {
        const newItems = new Map(prevItems);
        newItems.set(productId, currentQty - 1);
        return newItems;
      } else {
        const newItems = new Map(prevItems);
        newItems.delete(productId);
        return newItems;
      }
    });
  };

  const handleQuantityChange = (productId: string, qty: string) => {
    const quantity = parseInt(qty) || 0;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.currentStock) {
      Alert.alert('Invalid', `Only ${product.currentStock} available`);
      return;
    }

    setScannedItems(prevItems => {
      const newItems = new Map(prevItems);
      if (quantity > 0) {
        newItems.set(productId, quantity);
      } else {
        newItems.delete(productId);
      }
      return newItems;
    });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let profit = 0;
    scannedItems.forEach((qty, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const price = product.sellingPrice;
        const cost = product.buyingPrice;
        subtotal += price * qty;
        profit += (price - cost) * qty;
      }
    });
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax, profit };
  };

  const handleProceedToBill = () => {
    if (scannedItems.size === 0) {
      Alert.alert('No Items', 'Please add items first');
      return;
    }
    setCustomerStep('phone');
    setCustomerPhone('');
    setNewCustomerName('');
    setShowCustomerModal(true);
  };

  const handlePhoneSubmit = async () => {
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    const existingCustomer = customers.find(c => c.phone === customerPhone.trim());
    if (existingCustomer) {
      await createInvoice(existingCustomer);
    } else {
      setCustomerStep('name');
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomerName.trim(),
      phone: customerPhone.trim(),
      createdAt: new Date().toISOString(),
    };

    await CustomerService.save(customer);
    await loadData();
    await createInvoice(customer);
  };

  const createInvoice = async (customer: Customer) => {
    const items: InvoiceItem[] = [];

    scannedItems.forEach((qty, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const price = product.sellingPrice;
        const cost = product.buyingPrice;
        items.push({
          productId: product.id,
          productName: product.name,
          quantity: qty,
          price,
          costPrice: cost,
          total: price * qty,
        });
      }
    });

    const { subtotal, tax, total, profit } = calculateTotals();

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: InvoiceService.generateInvoiceNumber(),
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      subtotal,
      tax,
      total,
      profit,
      createdAt: new Date().toISOString(),
    };

    const success = await InvoiceService.save(invoice);
    if (success) {
      // Update products using ProductService.recordSale
      for (const item of items) {
        await ProductService.recordSale(
          item.productId,
          item.quantity,
          item.price,
          item.costPrice
        );
      }
      setCurrentInvoice(invoice);
      setShowCustomerModal(false);
      setShowInvoicePreview(true);
      setScannedItems(new Map());
      setCustomerPhone('');
      setNewCustomerName('');
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

  const itemsList = Array.from(scannedItems.entries()).map(([id, qty]) => {
    const product = products.find(p => p.id === id);
    return product ? { ...product, qty } : null;
  }).filter(Boolean);

  const { subtotal, tax, total, profit } = calculateTotals();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">Invoice</Typography>
        <TouchableOpacity onPress={() => navigation.navigate('InvoiceHistory')}>
          <Icon name="inbox" size={24} />
        </TouchableOpacity>
      </View>

      <Card style={styles.scannerCard}>
        <View style={styles.scannerHeader}>
          <Typography variant="h3" style={styles.sectionTitle}>Scan Barcode</Typography>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('SelectProduct', {
              onSelectProduct: (product: Product) => {
                setScannedItems(prevItems => {
                  const currentQty = prevItems.get(product.id) || 0;
                  if (currentQty < product.currentStock) {
                    const newItems = new Map(prevItems);
                    newItems.set(product.id, currentQty + 1);
                    return newItems;
                  } else {
                    Alert.alert('Out of Stock', `Only ${product.currentStock} available`);
                    return prevItems;
                  }
                });
              }
            })}
          >
            <Icon name="add" size={18} color={Colors.white} />
            <Typography variant="caption" style={styles.addButtonText}>Add Item</Typography>
          </TouchableOpacity>
        </View>
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
            <Typography variant="h3" style={styles.sectionTitle}>Items ({itemsList.length})</Typography>
            {itemsList.map((item: any) => (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemLeft}>
                  <Typography variant="body" style={styles.itemName}>{item.name}</Typography>
                  <Typography variant="caption" color={Colors.textLight}>
                    ${item.sellingPrice.toFixed(2)} × {item.qty}
                  </Typography>
                </View>
                <View style={styles.itemRight}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => handleDecrementItem(item.id)}
                  >
                    <Icon name="minus" size={16} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    value={item.qty.toString()}
                    onChangeText={(qty) => handleQuantityChange(item.id, qty)}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => handleIncrementItem(item.id)}
                  >
                    <Icon name="add" size={16} />
                  </TouchableOpacity>
                  <Typography variant="body" style={styles.itemTotal}>
                    ${(item.sellingPrice * item.qty).toFixed(2)}
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
                <Typography variant="body">${subtotal.toFixed(2)}</Typography>
              </View>
              <View style={styles.summaryRow}>
                <Typography variant="body">Tax (10%)</Typography>
                <Typography variant="body">${tax.toFixed(2)}</Typography>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Typography variant="h3">Total</Typography>
                <Typography variant="h3" color={Colors.primary}>${total.toFixed(2)}</Typography>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {itemsList.length > 0 && (
        <View style={styles.footer}>
          <Button title="Proceed to Bill" onPress={handleProceedToBill} />
        </View>
      )}

      {/* Customer Modal */}
      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Customer Details</Typography>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Icon name="close" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {customerStep === 'phone' ? (
                <Card style={styles.customerCard}>
                  <Typography variant="body" style={styles.sectionTitle}>
                    Enter Customer Phone Number
                  </Typography>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textLight}
                    autoFocus
                  />
                  <Button title="Continue" onPress={handlePhoneSubmit} />
                </Card>
              ) : (
                <Card style={styles.customerCard}>
                  <Typography variant="body" style={styles.sectionTitle}>
                    New Customer
                  </Typography>
                  <Typography variant="caption" color={Colors.textLight} style={{ marginBottom: Spacing.md }}>
                    Phone: {customerPhone}
                  </Typography>
                  <TextInput
                    style={styles.input}
                    placeholder="Customer Name"
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                    placeholderTextColor={Colors.textLight}
                    autoFocus
                  />
                  <Button title="Create Invoice" onPress={handleCreateCustomer} />
                  <Button 
                    title="Back" 
                    variant="outline" 
                    onPress={() => setCustomerStep('phone')} 
                    style={{ marginTop: Spacing.sm }}
                  />
                </Card>
              )}
            </View>
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
                          ${item.price.toFixed(2)} × {item.quantity}
                        </Typography>
                      </View>
                      <Typography variant="body">${item.total.toFixed(2)}</Typography>
                    </View>
                  ))}

                  <View style={styles.divider} />

                  <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                      <Typography variant="body">Subtotal:</Typography>
                      <Typography variant="body">${currentInvoice.subtotal.toFixed(2)}</Typography>
                    </View>
                    <View style={styles.summaryRow}>
                      <Typography variant="body">Tax (10%):</Typography>
                      <Typography variant="body">${currentInvoice.tax.toFixed(2)}</Typography>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Typography variant="h3">Total:</Typography>
                      <Typography variant="h3" color={Colors.primary}>${currentInvoice.total.toFixed(2)}</Typography>
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
    paddingTop: heightScale(60),
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scannerCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: mediumScale(20),
    gap: mediumScale(4),
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  scanButton: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.background,
    borderRadius: mediumScale(12),
    borderWidth: mediumScale(2),
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  cameraContainer: {
    height: heightScale(250),
    borderRadius: mediumScale(12),
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
    borderRadius: mediumScale(20),
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
    marginBottom: mediumScale(4),
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  qtyButton: {
    backgroundColor: Colors.background,
    borderRadius: mediumScale(6),
    padding: Spacing.xs,
    width: widthScale(28),
    height: heightScale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    backgroundColor: Colors.background,
    borderRadius: mediumScale(6),
    padding: Spacing.xs,
    width: widthScale(50),
    textAlign: 'center',
  },
  itemTotal: {
    fontWeight: '600',
    minWidth: widthScale(60),
    textAlign: 'right',
  },
  divider: {
    height: heightScale(1),
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
    borderTopWidth: mediumScale(2),
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
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
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
  customerCard: {
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: mediumScale(8),
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: mediumScale(16),
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
});
