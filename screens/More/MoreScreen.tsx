import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Linking, Platform, Share, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Typography, Card, Button, Icon, MenuItem } from '../../components';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';
import { ProductService, CategoryService, InvoiceService, CustomerService } from '../../services';

export default function MoreScreen({ navigation }: any) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handleExportData = async () => {
    Alert.alert(
      'Export Backup',
      '⚠️ Note: Product images will NOT be included in the backup. You\'ll need to re-add images after importing.\n\nChoose export method:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save as JSON File',
          onPress: handleExportAsFile,
        },
        {
          text: 'Share as Text',
          onPress: handleExportAsText,
        },
      ]
    );
  };

  const handleExportAsFile = async () => {
    try {
      setIsExporting(true);
      
      // Let user pick destination directory
      const destinationDir = await Directory.pickDirectoryAsync();
      
      // Gather all data
      const products = await ProductService.getAll();
      const categories = await CategoryService.getAll();
      const invoices = await InvoiceService.getAll();
      const customers = await CustomerService.getAll();

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          products,
          categories,
          invoices,
          customers,
        },
      };

      const dataString = JSON.stringify(exportData, null, 2);
      
      // Create backup file in user-selected location
      const timestamp = new Date().getTime();
      const backupFileName = `TrendwiseBackup_${timestamp}.json`;
      const backupFile = destinationDir.createFile(backupFileName, 'application/json');
      backupFile.write(dataString);
      
      // Save backup location to AsyncStorage
      await AsyncStorage.setItem('@trendwise_last_backup_location', backupFile.uri);
      
      Alert.alert(
        'Export Complete! ✅',
        `Backup created successfully!\n\n📊 Exported:\n• ${products.length} Products\n• ${categories.length} Categories\n• ${invoices.length} Invoices\n• ${customers.length} Customers\n\n⚠️ Images NOT included - will need to be re-added\n\n📁 Location:\n${backupFile.uri}`,
        [{ text: 'OK' }]
      );
      setIsExporting(false);
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.message.includes('cancel')) {
        Alert.alert('Cancelled', 'Backup export was cancelled.');
      } else {
        Alert.alert('Error', 'Failed to export data. Please try again.');
      }
      setIsExporting(false);
    }
  };

  const handleExportAsText = async () => {
    try {
      setIsExporting(true);
      
      // Gather all data
      const products = await ProductService.getAll();
      const categories = await CategoryService.getAll();
      const invoices = await InvoiceService.getAll();
      const customers = await CustomerService.getAll();

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          products,
          categories,
          invoices,
          customers,
        },
      };

      const dataString = JSON.stringify(exportData);
      
      // Share as text
      await Share.share({
        message: dataString,
        title: 'Trendwise Backup Data',
      });
      
      Alert.alert(
        'Share Complete! ✅',
        `Backup data shared successfully!\n\n📊 Exported:\n• ${products.length} Products\n• ${categories.length} Categories\n• ${invoices.length} Invoices\n• ${customers.length} Customers\n\n⚠️ Images NOT included\n\n💡 Tip: Copy and save this text somewhere safe. Use "Paste Text" option when importing.`,
        [{ text: 'OK' }]
      );
      setIsExporting(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to share data. Please try again.');
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Backup',
      '⚠️ This will replace ALL existing data!\n⚠️ Product images will NOT be restored - you\'ll need to re-add them manually.\n\nChoose import method:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose from File',
          onPress: handleImportFromFile,
        },
        {
          text: 'Paste Text',
          onPress: () => setShowImportModal(true),
        },
      ]
    );
  };

  const handleImportFromFile = async () => {
    try {
      setIsImporting(true);
      
      // Pick backup JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsImporting(false);
        return;
      }
      
      const jsonFile = new File(result.assets[0].uri);
      const jsonContent = await jsonFile.text();
      await processImportData(jsonContent);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  const handleImportFromText = async () => {
    if (!importText.trim()) {
      Alert.alert('Error', 'Please paste the backup text first.');
      return;
    }
    
    try {
      setShowImportModal(false);
      setIsImporting(true);
      await processImportData(importText);
      setImportText('');
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  const processImportData = async (jsonContent: string) => {
    try {
      const importData = JSON.parse(jsonContent);
      
      // Validate data structure
      if (!importData.data || !importData.version) {
        throw new Error('Invalid backup file format');
      }
      
      const { products, categories, invoices, customers } = importData.data;
      
      // Clear existing data
      await ProductService.clearAll();
      await CategoryService.clearAll();
      await InvoiceService.clearAll();
      await CustomerService.clearAll();
      
      // Import categories first
      if (categories && categories.length > 0) {
        for (const category of categories) {
          await CategoryService.save(category);
        }
      }
      
      // Import products (without images)
      if (products && products.length > 0) {
        for (const product of products) {
          const productToImport = { ...product, image: undefined };
          await ProductService.save(productToImport);
        }
      }
      
      // Import customers
      if (customers && customers.length > 0) {
        for (const customer of customers) {
          await CustomerService.save(customer);
        }
      }
      
      // Import invoices
      if (invoices && invoices.length > 0) {
        for (const invoice of invoices) {
          await InvoiceService.save(invoice);
        }
      }
      
      Alert.alert(
        'Success',
        `Import completed!\n\n• ${products?.length || 0} Products\n• ${categories?.length || 0} Categories\n• ${invoices?.length || 0} Invoices\n• ${customers?.length || 0} Customers\n\n⚠️ Remember to re-add product images manually.`
      );
      setIsImporting(false);
    } catch (error) {
      console.error('Parse error:', error);
      Alert.alert('Error', `Failed to read backup data: ${error instanceof Error ? error.message : 'Invalid backup format'}`);
      setIsImporting(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all products, invoices, customers, and categories. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.clearAll();
              await CategoryService.clearAll();
              await InvoiceService.clearAll();
              await CustomerService.clearAll();
              Alert.alert('Success', 'All data has been deleted.');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
      android: 'https://play.google.com/store/apps/details?id=com.trendwise.inventory',
    });

    Alert.alert(
      'Rate Trendwise',
      'Enjoying the app? Please take a moment to rate us!',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            if (storeUrl) {
              Linking.openURL(storeUrl).catch(() => {
                Alert.alert('Error', 'Unable to open store link');
              });
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    const message = Platform.select({
      ios: 'Check out Trendwise - Smart Inventory Management! https://apps.apple.com/app/id123456789',
      android: 'Check out Trendwise - Smart Inventory Management! https://play.google.com/store/apps/details?id=com.trendwise.inventory',
    });

    try {
      await Share.share({
        message: message || 'Check out Trendwise - Smart Inventory Management!',
        title: 'Share Trendwise',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'About Trendwise',
      'Version 1.0.0\n\n' +
      'Trendwise is a smart inventory management system designed to help businesses track inventory, manage stock levels, generate invoices, and grow their business.\n\n' +
      '© 2026 Trendwise. All rights reserved.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us:\n\n' +
      'Email: support@trendwise.com\n' +
      'Website: www.trendwise.com\n\n' +
      'We typically respond within 24 hours.',
      [
        { text: 'OK' },
        {
          text: 'Send Email',
          onPress: () => {
            Linking.openURL('mailto:support@trendwise.com?subject=Trendwise Support Request');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">More</Typography>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <Icon name="profile" size={mediumScale(50)} color={Colors.white} />
          </View>
          <Typography variant="h3" style={styles.profileName}>
            Trendwise
          </Typography>
          <Typography variant="caption" color={Colors.textLight}>
            Inventory Management System
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="body" color={Colors.textLight} style={styles.sectionTitle}>
            DATA MANAGEMENT
          </Typography>
          
          <MenuItem
            icon="inbox"
            title="Import Data"
            subtitle="From file or paste text"
            onPress={handleImportData}
          />
          
          <MenuItem
            icon="send"
            title="Export Data"
            subtitle="Save as file or share text"
            onPress={handleExportData}
          />
          
          <MenuItem
            icon="delete"
            title="Delete All Data"
            subtitle="Clear all data permanently"
            onPress={handleDeleteAllData}
            danger
          />
        </View>

        <View style={styles.section}>
          <Typography variant="body" color={Colors.textLight} style={styles.sectionTitle}>
            NOTIFICATIONS
          </Typography>
          
          <MenuItem
            icon="alert"
            title="Notification Settings"
            subtitle="Manage stock alerts and reminders"
            onPress={() => (navigation as any).navigate('NotificationSettings')}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="body" color={Colors.textLight} style={styles.sectionTitle}>
            APP
          </Typography>
          
          <MenuItem
            icon="star-filled"
            title="Rate Trendwise"
            subtitle="Show us some love"
            onPress={handleRateApp}
            iconColor={Colors.gold}
          />
          
          <MenuItem
            icon="send"
            title="Share App"
            subtitle="Tell your friends"
            onPress={handleShareApp}
          />
          
          <MenuItem
            icon="info"
            title="About"
            subtitle="Version & app information"
            onPress={handleAbout}
          />
          
          <MenuItem
            icon="chat"
            title="Help & Support"
            subtitle="Get help or contact us"
            onPress={handleHelpSupport}
          />
        </View>

        <View style={{ height: heightScale(40) }} />
      </ScrollView>

      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={styles.modalTitle}>
              Paste Backup Text
            </Typography>
            <Typography variant="caption" color={Colors.textLight} style={styles.modalSubtitle}>
              Paste the backup text you received from "Share as Text"
            </Typography>
            
            <TextInput
              style={styles.textInput}
              value={importText}
              onChangeText={setImportText}
              placeholder="Paste backup JSON here..."
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
              >
                <Typography variant="body" style={styles.modalButtonText}>
                  Cancel
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonImport]}
                onPress={handleImportFromText}
              >
                <Typography variant="body" style={styles.modalButtonTextImport}>
                  Import
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: heightScale(60),
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  profileContainer: {
    width: mediumScale(100),
    height: mediumScale(100),
    borderRadius: mediumScale(50),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileName: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: mediumScale(12),
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: mediumScale(12),
    padding: Spacing.lg,
    width: '100%',
    maxWidth: widthScale(500),
  },
  modalTitle: {
    marginBottom: heightScale(8),
  },
  modalSubtitle: {
    marginBottom: heightScale(16),
  },
  textInput: {
    borderWidth: mediumScale(1),
    borderColor: Colors.textLight,
    borderRadius: mediumScale(8),
    padding: Spacing.md,
    fontSize: mediumScale(14),
    minHeight: heightScale(150),
    maxHeight: heightScale(300),
    backgroundColor: Colors.light,
    marginBottom: heightScale(16),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: mediumScale(8),
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.light,
  },
  modalButtonImport: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalButtonTextImport: {
    fontWeight: '600',
    color: Colors.white,
  },
  notificationContainer: {
    backgroundColor: Colors.white,
    borderRadius: mediumScale(12),
    padding: Spacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: heightScale(2),
  },
  divider: {
    height: mediumScale(1),
    backgroundColor: Colors.light,
    marginVertical: Spacing.md,
  },
  settingItem: {
    marginBottom: Spacing.md,
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: heightScale(8),
    color: Colors.textPrimary,
  },
  settingValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: heightScale(10),
    paddingHorizontal: Spacing.md,
    borderRadius: mediumScale(8),
    backgroundColor: Colors.light,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
  },
  frequencyButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: Colors.white,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayButton: {
    width: mediumScale(45),
    height: mediumScale(45),
    borderRadius: mediumScale(8),
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
  },
  dayButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: mediumScale(12),
  },
  dayButtonTextActive: {
    color: Colors.white,
  },
  alertTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: heightScale(8),
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
    paddingBottom: Platform.OS === 'ios' ? heightScale(40) : heightScale(20),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.light,
  },
  timePickerTitle: {
    flex: 1,
  },
  doneButton: {
    fontWeight: '600',
    fontSize: mediumScale(16),
  },
  timePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? heightScale(180) : heightScale(40),
  },
  androidButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  androidButton: {
    padding: Spacing.md,
    borderRadius: mediumScale(8),
    alignItems: 'center',
  },
  androidButtonCancel: {
    backgroundColor: Colors.light,
  },
});