import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

/**
 * NotificationService
 * 
 * Centralized service for managing push notifications and notification settings.
 * Handles scheduling, canceling, and persisting notification preferences.
 */

const NOTIFICATION_SETTINGS_KEY = '@trendwise_notification_settings';
const NOTIFICATION_ID_KEY = '@trendwise_notification_id';

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  days: string[];
  time: string; // Format: "HH:MM"
  alertTypes: {
    criticalStock: boolean;
    lowStock: boolean;
    outOfStock: boolean;
  };
  monthlyDay?: number; // 1-31
  yearlyMonth?: number; // 1-12
  yearlyDay?: number; // 1-31
}

class NotificationServiceClass {
  /**
   * Setup notification configuration for both iOS and Android
   * Required for notifications to work properly on both platforms
   */
  async setupNotifications(): Promise<void> {
    // Configure how notifications are displayed when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Android: Setup notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('stock-alerts', {
        name: 'Stock Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // iOS: Configure notification categories (optional but recommended)
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('stock-alert', [
        {
          identifier: 'view',
          buttonTitle: 'View Inventory',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }
  }

  /**
   * Load notification settings from AsyncStorage
   * @returns NotificationSettings or null if not found
   */
  async loadSettings(): Promise<NotificationSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
      return null;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return null;
    }
  }

  /**
   * Save notification settings to AsyncStorage
   * @param settings - NotificationSettings object to save
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions from the user
   * Shows system dialog or navigates to settings if needed
   * @returns boolean indicating if permission was granted
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      
      if (newStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive stock alerts.',
          [
            { text: 'Cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule notifications based on settings
   * @param settings - NotificationSettings object with scheduling preferences
   */
  async scheduleNotifications(settings: NotificationSettings): Promise<void> {
    try {
      const [hours, minutes] = settings.time.split(':').map(Number);

      const notificationContent = {
        title: 'Trendwise Stock Alert',
        body: 'Time to check your inventory levels!',
        data: { type: 'stock_check' },
        ...(Platform.OS === 'android' && { channelId: 'stock-alerts' }),
      };

      if (settings.frequency === 'daily') {
        await this.scheduleDailyNotification(hours, minutes, notificationContent);
      } else if (settings.frequency === 'weekly') {
        await this.scheduleWeeklyNotifications(hours, minutes, settings.days, notificationContent);
      } else if (settings.frequency === 'monthly') {
        await this.scheduleMonthlyNotification(
          hours, 
          minutes, 
          settings.monthlyDay || 1, 
          notificationContent
        );
      } else if (settings.frequency === 'yearly') {
        await this.scheduleYearlyNotification(
          hours, 
          minutes, 
          settings.yearlyMonth || 1, 
          settings.yearlyDay || 1, 
          notificationContent
        );
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule a daily notification
   */
  private async scheduleDailyNotification(
    hour: number, 
    minute: number, 
    content: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
      } as any,
    });
  }

  /**
   * Schedule weekly notifications for selected days
   */
  private async scheduleWeeklyNotifications(
    hour: number, 
    minute: number, 
    days: string[], 
    content: any
  ): Promise<void> {
    const dayMap: { [key: string]: number } = {
      sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7
    };

    for (const day of days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          weekday: dayMap[day],
          hour,
          minute,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
        } as any,
      });
    }
  }

  /**
   * Schedule a monthly notification on a specific day
   */
  private async scheduleMonthlyNotification(
    hour: number, 
    minute: number, 
    day: number, 
    content: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        day,
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
      } as any,
    });
  }

  /**
   * Schedule a yearly notification on a specific month and day
   */
  private async scheduleYearlyNotification(
    hour: number, 
    minute: number, 
    month: number, 
    day: number, 
    content: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        month,
        day,
        hour,
        minute,
        repeats: true,
        channelId: Platform.OS === 'android' ? 'stock-alerts' : undefined,
      } as any,
    });
  }

  /**
   * Complete save workflow: validate permissions, save settings, and schedule notifications
   * @param settings - NotificationSettings to save and apply
   * @returns boolean indicating success
   */
  async saveAndSchedule(settings: NotificationSettings): Promise<boolean> {
    try {
      // Check permissions if notifications are enabled
      if (settings.enabled) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          return false;
        }
      }

      // Save settings
      await this.saveSettings(settings);

      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Schedule new notifications if enabled
      if (settings.enabled) {
        await this.scheduleNotifications(settings);
      }

      return true;
    } catch (error) {
      console.error('Failed to save and schedule notifications:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications (useful for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }
}

export const NotificationService = new NotificationServiceClass();
