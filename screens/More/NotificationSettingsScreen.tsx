import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Card, Button, Icon, SettingRow, NumberPicker, Divider } from '../../components';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';
import { NotificationService } from '../../services';

export default function NotificationSettingsScreen({ navigation }: any) {
  // Original state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [notificationTime, setNotificationTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alertCriticalStock, setAlertCriticalStock] = useState(true);
  const [alertLowStock, setAlertLowStock] = useState(true);
  const [alertOutOfStock, setAlertOutOfStock] = useState(true);
  
  // New state for monthly/yearly
  const [monthlyDay, setMonthlyDay] = useState(1); // 1-31
  const [yearlyMonth, setYearlyMonth] = useState(1); // 1-12 (Jan = 1)
  const [yearlyDay, setYearlyDay] = useState(1); // 1-31
  
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    NotificationService.setupNotifications();
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settings = await NotificationService.loadSettings();
      if (settings) {
        setNotificationsEnabled(settings.enabled || false);
        setNotificationFrequency(settings.frequency || 'daily');
        setSelectedDays(settings.days || ['mon', 'tue', 'wed', 'thu', 'fri']);
        if (settings.time) {
          const [hours, minutes] = settings.time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setNotificationTime(date);
        }
        setAlertCriticalStock(settings.alertTypes?.criticalStock ?? true);
        setAlertLowStock(settings.alertTypes?.lowStock ?? true);
        setAlertOutOfStock(settings.alertTypes?.outOfStock ?? true);
        setMonthlyDay(settings.monthlyDay || 1);
        setYearlyMonth(settings.yearlyMonth || 1);
        setYearlyDay(settings.yearlyDay || 1);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare settings object
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
        monthlyDay: monthlyDay,
        yearlyMonth: yearlyMonth,
        yearlyDay: yearlyDay,
      };

      // Use NotificationService to save and schedule
      const success = await NotificationService.saveAndSchedule(settings);
      
      if (success) {
        Alert.alert('Success', 'Notification settings saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
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

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const days = [
    { key: 'sun', label: 'S' },
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Icon name="arrow-left" size={mediumScale(24)} />
        </TouchableOpacity>
        <Typography variant="h2">Notification Settings</Typography>
        <View style={{ width: mediumScale(24) }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          {/* Enable Notifications Toggle */}
          <SettingRow
            title="Enable Notifications"
            subtitle="Receive stock level alerts"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />

          {notificationsEnabled && (
            <>
              <Divider />

              {/* Frequency Selector */}
              <View style={styles.section}>
                <Typography variant="body" style={styles.sectionTitle}>
                  Frequency
                </Typography>
                <View style={styles.frequencyButtons}>
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        notificationFrequency === freq && styles.frequencyButtonActive,
                      ]}
                      onPress={() => setNotificationFrequency(freq)}
                    >
                      <Typography
                        variant="body"
                        color={notificationFrequency === freq ? Colors.white : Colors.textPrimary}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Weekly Day Selector */}
              {notificationFrequency === 'weekly' && (
                <>
                  <Divider />
                  <View style={styles.section}>
                    <Typography variant="body" style={styles.sectionTitle}>
                      Select Days
                    </Typography>
                    <View style={styles.daysContainer}>
                      {days.map((day) => (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayButton,
                            selectedDays.includes(day.key) && styles.dayButtonActive,
                          ]}
                          onPress={() => toggleDay(day.key)}
                        >
                          <Typography
                            variant="body"
                            color={selectedDays.includes(day.key) ? Colors.white : Colors.textPrimary}
                          >
                            {day.label}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* Monthly Day Selector */}
              {notificationFrequency === 'monthly' && (
                <>
                  <Divider />
                  <View style={styles.section}>
                    <Typography variant="body" style={styles.sectionTitle}>
                      Day of Month
                    </Typography>
                    <NumberPicker
                      value={monthlyDay}
                      onIncrement={() => setMonthlyDay(Math.min(31, monthlyDay + 1))}
                      onDecrement={() => setMonthlyDay(Math.max(1, monthlyDay - 1))}
                      subtitle="day of month"
                    />
                  </View>
                </>
              )}

              {/* Yearly Month and Day Selector */}
              {notificationFrequency === 'yearly' && (
                <>
                  <Divider />
                  <View style={styles.section}>
                    <Typography variant="body" style={styles.sectionTitle}>
                      Month
                    </Typography>
                    <NumberPicker
                      value={getMonthName(yearlyMonth)}
                      onIncrement={() => setYearlyMonth(yearlyMonth === 12 ? 1 : yearlyMonth + 1)}
                      onDecrement={() => setYearlyMonth(yearlyMonth === 1 ? 12 : yearlyMonth - 1)}
                      variant="h3"
                    />
                  </View>

                  <Divider />
                  <View style={styles.section}>
                    <Typography variant="body" style={styles.sectionTitle}>
                      Day of Month
                    </Typography>
                    <NumberPicker
                      value={yearlyDay}
                      onIncrement={() => setYearlyDay(Math.min(31, yearlyDay + 1))}
                      onDecrement={() => setYearlyDay(Math.max(1, yearlyDay - 1))}
                      subtitle="day of month"
                    />
                  </View>
                </>
              )}

              {/* Time Picker */}
              <Divider />
              <View style={styles.section}>
                <Typography variant="body" style={styles.sectionTitle}>
                  Notification Time
                </Typography>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="alert" size={mediumScale(24)} color={Colors.primary} />
                  <Typography variant="h3" color={Colors.primary}>
                    {formatTime(notificationTime)}
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Alert Types */}
              <Divider />
              <View style={styles.section}>
                <Typography variant="body" style={styles.sectionTitle}>
                  Alert Types
                </Typography>

                <SettingRow
                  title="Critical Stock"
                  subtitle="Alert when stock is at critical level"
                  value={alertCriticalStock}
                  onValueChange={setAlertCriticalStock}
                />

                <View style={styles.spacer} />

                <SettingRow
                  title="Low Stock"
                  subtitle="Alert when stock is below minimum"
                  value={alertLowStock}
                  onValueChange={setAlertLowStock}
                />

                <View style={styles.spacer} />

                <SettingRow
                  title="Out of Stock"
                  subtitle="Alert when products are out of stock"
                  value={alertOutOfStock}
                  onValueChange={setAlertOutOfStock}
                />
              </View>
            </>
          )}
        </Card>

        {/* Save and Cancel Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title={isSaving ? "Saving..." : "Save Settings"}
            onPress={isSaving ? () => {} : handleSave}
            style={styles.button}
          />
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Typography variant="body" color={Colors.primary}>
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={notificationTime}
                mode="time"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setNotificationTime(selectedDate);
                  }
                }}
                style={styles.timePicker}
              />
            </View>
          </View>
        ) : (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setNotificationTime(selectedDate);
              }
            }}
          />
        )
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: heightScale(60),
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  spacer: {
    height: Spacing.md,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  frequencyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: mediumScale(8),
    borderWidth: mediumScale(1),
    borderColor: Colors.textLight,
    backgroundColor: Colors.white,
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  dayButton: {
    width: widthScale(40),
    height: widthScale(40),
    borderRadius: widthScale(20),
    borderWidth: mediumScale(1),
    borderColor: Colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: mediumScale(8),
    borderWidth: mediumScale(1),
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    flex: 1,
  },
  timePickerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.border,
  },
  timePicker: {
    backgroundColor: Colors.white,
  },
});
