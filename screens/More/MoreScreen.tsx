import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Linking, Platform, Share, Modal, TextInput, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Typography from '../../components/Typography';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import Icon from '../../components/Icon';
import { widthScale, heightScale, mediumScale } from '../../constants/size';
import { ProductService, CategoryService, InvoiceService, CustomerService } from '../../services';

const NOTIFICATION_SETTINGS_KEY = '@trendwise_notification_settings';
const NOTIFICATION_ID_KEY = '@trendwise_notification_id';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Notification settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [notificationTime, setNotificationTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alertCriticalStock, setAlertCriticalStock] = useState(true);
  const [alertLowStock, setAlertLowStock] = useState(true);
  const [alertOutOfStock, setAlertOutOfStock] = useState(true);

  // Load notification settings on mount
  useEffect(() => {
    loadNotificationSettings();
    requestNotificationPermissions();
    setupAndroidChannel();
  }, []);

  // Save settings and reschedule when they change
  useEffect(() => {
    if (notificationsEnabled) {
      saveNotificationSettings();
      scheduleNotifications();
    } else {
      cancelAllNotifications();
    }
  }, [
    notificationsEnabled,
    notificationFrequency,
    selectedDays,
    notificationTime,
    alertCriticalStock,
    alertLowStock,
    alertOutOfStock,
  ]);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
    }
  };

  const setupAndroidChannel = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('stock-alerts', {
        name: 'Stock Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.enabled || false);
        setNotificationFrequency(parsed.frequency || 'daily');
        setSelectedDays(parsed.days || ['mon', 'tue', 'wed', 'thu', 'fri']);
        if (parsed.time) {
          const [hours, minutes] = parsed.time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setNotificationTime(date);
        }
        setAlertCriticalStock(parsed.alertTypes?.criticalStock ?? true);
        setAlertLowStock(parsed.alertTypes?.lowStock ?? true);
        setAlertOutOfStock(parsed.alertTypes?.outOfStock ?? true);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const settings = {
        enabled: notificationsEnabled,
        frequency: notificationFrequency,
        days: selectedDays,
        time: `${notificationTime.getHours()}:${notificationTime.getMinutes()}`,
        alertTypes: {
          criticalStock: alertCriticalStock,
          lowStock: alertLowStock,
          outOfStock: alertOutOfStock,
        },
      };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const scheduleNotifications = async () => {
    try {
      // Cancel existing notifications first
      await cancelAllNotifications();

      if (!notificationsEnabled) return;

      const hour = notificationTime.getHours();
      const minute = notificationTime.getMinutes();

      if (notificationFrequency === 'weekly') {
        // For weekly, schedule for each selected day
        const dayMap: { [key: string]: number } = {
          sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7
        };

        for (const day of selectedDays) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Trendwise Stock Alert',
              body: 'Time to check your inventory levels!',
              data: { type: 'stock_check' },
              ...(Platform.OS === 'android' && { channelId: 'stock-alerts' }),
            },
            trigger: {
              weekday: dayMap[day],
              hour: hour,
              minute: minute,
              repeats: true,
              channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
            } as any,
          });
        }
      } else if (notificationFrequency === 'daily') {
        // Daily notification at specific time
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Trendwise Stock Alert',
            body: 'Time to check your inventory levels!',
            data: { type: 'stock_check' },
            ...(Platform.OS === 'android' && { channelId: 'stock-alerts' }),
          },
          trigger: {
            hour: hour,
            minute: minute,
            repeats: true,
            channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
          } as any,
        });
      } else if (notificationFrequency === 'monthly') {
        // Monthly notification on the 1st of each month
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Trendwise Stock Alert',
            body: 'Time to check your inventory levels!',
            data: { type: 'stock_check' },
            ...(Platform.OS === 'android' && { channelId: 'stock-alerts' }),
          },
          trigger: {
            day: 1,
            hour: hour,
            minute: minute,
            repeats: true,
            channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
          } as any,
        });
      }

      Alert.alert(
        'Notifications Scheduled',
        `You will receive ${notificationFrequency} stock alerts at ${formatTime(notificationTime)}.`
      );
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      Alert.alert('Error', `Failed to schedule notifications. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (value) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive stock alerts.',
            [
              { text: 'Cancel', onPress: () => setNotificationsEnabled(false) },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }
      Alert.alert(
        'Notifications Enabled',
        'You will receive stock alerts based on your settings.'
      );
    } else {
      Alert.alert(
        'Notifications Disabled',
        'Stock alert notifications have been turned off.'
      );
    }
  };

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

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setNotificationTime(selectedTime);
      if (Platform.OS === 'ios') {
        // On iOS, we keep the picker open
      }
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
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
          
          <View style={styles.notificationContainer}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationTextContainer}>
                <Typography variant="body" style={styles.notificationTitle}>
                  Enable Notifications
                </Typography>
                <Typography variant="caption" color={Colors.textLight}>
                  Get alerts for stock levels
                </Typography>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: Colors.textLight, true: Colors.secondary }}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.white}
              />
            </View>
            
            {notificationsEnabled && (
              <>
                <View style={styles.divider} />
                
                <View style={styles.settingItem}>
                  <Typography variant="body" style={styles.settingLabel}>
                    Frequency
                  </Typography>
                  <View style={styles.frequencyButtons}>
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        notificationFrequency === 'daily' && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setNotificationFrequency('daily')}
                    >
                      <Typography
                        variant="caption"
                        color={notificationFrequency === 'daily' ? Colors.white : Colors.textSecondary}
                        style={styles.frequencyButtonText}
                      >
                        Daily
                      </Typography>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        notificationFrequency === 'weekly' && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setNotificationFrequency('weekly')}
                    >
                      <Typography
                        variant="caption"
                        color={notificationFrequency === 'weekly' ? Colors.white : Colors.textSecondary}
                        style={styles.frequencyButtonText}
                      >
                        Weekly
                      </Typography>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        notificationFrequency === 'monthly' && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setNotificationFrequency('monthly')}
                    >
                      <Typography
                        variant="caption"
                        color={notificationFrequency === 'monthly' ? Colors.white : Colors.textSecondary}
                        style={styles.frequencyButtonText}
                      >
                        Monthly
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {notificationFrequency === 'weekly' && (
                  <View style={styles.settingItem}>
                    <Typography variant="body" style={styles.settingLabel}>
                      Select Days
                    </Typography>
                    <View style={styles.daysContainer}>
                      {[
                        { key: 'mon', label: 'Mon' },
                        { key: 'tue', label: 'Tue' },
                        { key: 'wed', label: 'Wed' },
                        { key: 'thu', label: 'Thu' },
                        { key: 'fri', label: 'Fri' },
                        { key: 'sat', label: 'Sat' },
                        { key: 'sun', label: 'Sun' },
                      ].map((day) => (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayButton,
                            selectedDays.includes(day.key) && styles.dayButtonActive,
                          ]}
                          onPress={() => {
                            if (selectedDays.includes(day.key)) {
                              setSelectedDays(selectedDays.filter(d => d !== day.key));
                            } else {
                              setSelectedDays([...selectedDays, day.key]);
                            }
                          }}
                        >
                          <Typography
                            variant="caption"
                            color={selectedDays.includes(day.key) ? Colors.white : Colors.textSecondary}
                            style={styles.dayButtonText}
                          >
                            {day.label}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Typography variant="body" style={styles.settingLabel}>
                    Notification Time
                  </Typography>
                  <Typography variant="body" style={styles.settingValue}>
                    {formatTime(notificationTime)}
                  </Typography>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <Typography variant="body" style={styles.settingLabel}>
                  Alert Types
                </Typography>
                
                <View style={styles.alertTypeRow}>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    Critical Stock (0 items)
                  </Typography>
                  <Switch
                    value={alertCriticalStock}
                    onValueChange={setAlertCriticalStock}
                    trackColor={{ false: Colors.textLight, true: Colors.secondary }}
                    thumbColor={alertCriticalStock ? Colors.primary : Colors.white}
                  />
                </View>
                
                <View style={styles.alertTypeRow}>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    Low Stock (below minimum)
                  </Typography>
                  <Switch
                    value={alertLowStock}
                    onValueChange={setAlertLowStock}
                    trackColor={{ false: Colors.textLight, true: Colors.secondary }}
                    thumbColor={alertLowStock ? Colors.primary : Colors.white}
                  />
                </View>
                
                <View style={styles.alertTypeRow}>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    Out of Stock
                  </Typography>
                  <Switch
                    value={alertOutOfStock}
                    onValueChange={setAlertOutOfStock}
                    trackColor={{ false: Colors.textLight, true: Colors.secondary }}
                    thumbColor={alertOutOfStock ? Colors.primary : Colors.white}
                  />
                </View>
              </>
            )}
          </View>
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

      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <Typography variant="h3" style={styles.timePickerTitle}>
                  Select Time
                </Typography>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Typography variant="body" color={Colors.primary} style={styles.doneButton}>
                      Done
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
              
              <DateTimePicker
                value={notificationTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
              
              {Platform.OS === 'android' && (
                <View style={styles.androidButtonContainer}>
                  <TouchableOpacity
                    style={[styles.androidButton, styles.androidButtonCancel]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Typography variant="body" color={Colors.textPrimary}>
                      Cancel
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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