import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Linking, Platform, Share } from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Typography from '../../components/Typography';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import Icon from '../../components/Icon';
import { widthScale, heightScale, mediumScale } from '../../constants/size';
import { ProductService, CategoryService, InvoiceService, CustomerService } from '../../services';

interface MenuItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  danger?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, iconColor, danger }: MenuItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.menuItem}>
        <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
          <Icon name={icon} size={mediumScale(24)} color={iconColor || (danger ? Colors.danger : Colors.primary)} />
        </View>
        <View style={styles.menuItemText}>
          <Typography 
            variant="body" 
            style={styles.menuTitle}
            color={danger ? Colors.danger : Colors.textPrimary}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color={Colors.textLight}>
              {subtitle}
            </Typography>
          )}
        </View>
        <Icon name="arrow-right" size={mediumScale(20)} color={Colors.textLight} />
      </Card>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Ask user to choose backup location
      Alert.alert(
        'Choose Backup Location',
        'Select where you want to save your backup folder. Choose an easily accessible location like Downloads or a folder you can easily find.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsExporting(false) },
          {
            text: 'Choose Location',
            onPress: async () => {
              try {
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
                
                // Create backup folder in user-selected location
                const timestamp = new Date().getTime();
                const backupFolderName = `TrendwiseBackup_${timestamp}`;
                const backupDir = destinationDir.createDirectory(backupFolderName);
                
                // Save JSON backup
                const jsonFile = backupDir.createFile('backup.json', 'application/json');
                jsonFile.write(dataString);
                
                // Copy images if any
                let imagesCopied = 0;
                const productsWithImages = products.filter(p => p.image);
                
                if (productsWithImages.length > 0) {
                  const imagesDir = backupDir.createDirectory('images');
                  
                  for (const product of productsWithImages) {
                    if (product.image && product.id) {
                      try {
                        const fileExtension = product.image.split('.').pop() || 'jpg';
                        const sourceFile = new File(product.image);
                        const destFile = imagesDir.createFile(`${product.id}.${fileExtension}`, null);
                        sourceFile.copy(destFile);
                        imagesCopied++;
                      } catch (error) {
                        console.warn(`Failed to copy image for product ${product.id}:`, error);
                      }
                    }
                  }
                }
                
                // Save backup location to AsyncStorage
                await AsyncStorage.setItem('@trendwise_last_backup_location', backupDir.uri);
                
                Alert.alert(
                  'Export Complete! ✅',
                  `Backup created successfully!\n\n📊 Exported:\n• ${products.length} Products\n• ${categories.length} Categories\n• ${invoices.length} Invoices\n• ${customers.length} Customers\n• ${imagesCopied} Product Images\n\n📁 Location:\n${backupDir.uri}\n\n✅ Your backup folder "${backupFolderName}" includes everything needed for restore. You can now access it through your file manager.`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Export error:', error);
                if (error instanceof Error && error.message.includes('cancel')) {
                  Alert.alert('Cancelled', 'Backup export was cancelled.');
                } else {
                  Alert.alert('Error', 'Failed to export data. Please try again.');
                }
              } finally {
                setIsExporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to show export dialog. Please try again.');
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    // Show instructions first
    Alert.alert(
      'Import Backup',
      '📋 Instructions:\n\n1. Make sure you have copied the ENTIRE backup folder (including the "images" subfolder) to this device\n\n2. Select the "backup.json" file from that folder\n\n3. The app will automatically find and restore images if the "images" folder is in the same location\n\n⚠️ Selecting only backup.json without the images folder will import data but NOT images.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Backup File',
          onPress: async () => {
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
              
              await processImport(result.assets[0].uri);
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert('Error', `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const processImport = async (fileUri: string) => {
    try {
      const jsonFile = new File(fileUri);
      
      // Read the JSON file
      const jsonContent = await jsonFile.text();
      const importData = JSON.parse(jsonContent);
      
      // Validate data structure
      if (!importData.data || !importData.version) {
        throw new Error('Invalid backup file format');
      }
      
      const { products, categories, invoices, customers } = importData.data;
      
      // Count products that had images in the backup
      const productsWithImagesPaths = products?.filter((p: any) => p.image) || [];
      
      // Check for images folder in the same directory as the JSON
      const backupFolder = fileUri.substring(0, fileUri.lastIndexOf('/') + 1);
      const imagesDir = new Directory(`${backupFolder}images`);
      const imagesFolderExists = imagesDir.exists;
      
      // Show confirmation with image info
      Alert.alert(
        'Import Data',
        `⚠️ This will replace ALL existing data!\n\nFound in backup:\n• ${products?.length || 0} Products${productsWithImagesPaths.length > 0 ? ` (${productsWithImagesPaths.length} with images)` : ''}\n• ${categories?.length || 0} Categories\n• ${invoices?.length || 0} Invoices\n• ${customers?.length || 0} Customers\n\n${imagesFolderExists ? '✅ Images folder detected - images will be restored' : '❌ Images folder NOT found - images will NOT be restored'}\n\n${!imagesFolderExists && productsWithImagesPaths.length > 0 ? '💡 Tip: Make sure the "images" folder is in the same directory as backup.json' : ''}\n\nContinue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
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
                
                // Import products and restore images if available
                let imagesRestored = 0;
                if (products && products.length > 0) {
                  for (const product of products) {
                    let productToImport = { ...product };
                    
                    // Try to restore image if images folder exists
                    if (imagesFolderExists && product.id) {
                      try {
                        // Try common image extensions
                        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
                        let imageRestored = false;
                        
                        for (const ext of extensions) {
                          const sourceImageFile = new File(imagesDir, `${product.id}.${ext}`);
                          if (sourceImageFile.exists) {
                            // Copy image to app's directory
                            const destImageFile = new File(Paths.document, `product_${product.id}_${Date.now()}.${ext}`);
                            sourceImageFile.copy(destImageFile);
                            productToImport.image = destImageFile.uri;
                            imagesRestored++;
                            imageRestored = true;
                            break;
                          }
                        }
                        
                        if (!imageRestored) {
                          productToImport.image = undefined;
                        }
                      } catch (error) {
                        console.warn(`Failed to restore image for product ${product.id}:`, error);
                        productToImport.image = undefined;
                      }
                    } else {
                      productToImport.image = undefined;
                    }
                    
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
                  `Import completed!\n\n• ${products?.length || 0} Products\n• ${categories?.length || 0} Categories\n• ${invoices?.length || 0} Invoices\n• ${customers?.length || 0} Customers${imagesRestored > 0 ? `\n• ${imagesRestored} Images Restored` : ''}${imagesFolderExists && imagesRestored === 0 ? '\n\n⚠️ Images folder found but no images were restored. You may need to re-add product images.' : !imagesFolderExists ? '\n\n⚠️ No images folder found. Please add product images manually.' : ''}`
                );
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Error', 'Failed to import data. Please try again.');
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Parse error:', error);
      Alert.alert('Error', `Failed to read backup file: ${error instanceof Error ? error.message : 'Invalid backup file'}`);
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
            subtitle="Import backup with images"
            onPress={handleImportData}
          />
          
          <MenuItem
            icon="send"
            title="Export Data"
            subtitle="Choose location & backup with images"
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
            APP
          </Typography>
          
          <MenuItem
            icon="star-filled"
            title="Rate Trendwise"
            subtitle="Show us some love"
            onPress={handleRateApp}
            iconColor="#FFB800"
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
    borderBottomColor: '#E0E0E0',
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
  iconContainer: {
    width: mediumScale(40),
    height: mediumScale(40),
    borderRadius: mediumScale(20),
    backgroundColor: Colors.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerDanger: {
    backgroundColor: '#FFE5E5',
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    marginBottom: heightScale(2),
  },
});