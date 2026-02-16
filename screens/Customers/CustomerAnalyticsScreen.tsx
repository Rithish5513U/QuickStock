import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Invoice, Customer } from '../../models';
import { InvoiceService, CustomerService, AnalyticsService } from '../../services';
import Typography from '../../components/Typography';
import Icon from '../../components/Icon';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { widthScale, heightScale, mediumScale } from '../../constants/size';

interface CustomerAnalytics {
  name: string;
  phone: string;
  totalRevenue: number;
  totalProfit: number;
  visitCount: number;
  lastVisit: string;
  firstVisit: string;
  topProducts: { name: string; quantity: number }[];
  invoiceIds: string[];
}

type RootStackParamList = {
  CustomerDetails: { customerPhone: string };
};

export default function CustomerAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [customers, setCustomers] = useState<CustomerAnalytics[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerAnalytics[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'visits' | 'recent'>('revenue');

  useFocusEffect(
    React.useCallback(() => {
      loadCustomerAnalytics();
    }, [])
  );

  const loadCustomerAnalytics = async () => {
    setIsLoading(true);
    const allInvoices = await InvoiceService.getAll();
    const allCustomers = await CustomerService.getAll();

    const customerList = await AnalyticsService.getCustomerAnalytics(allCustomers, allInvoices);
    setCustomers(customerList);
    setFilteredCustomers(customerList);
    setIsLoading(false);
  };

  useEffect(() => {
    // Filter customers based on search
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort customers
    filtered.sort((a, b) => {
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'visits') return b.visitCount - a.visitCount;
      if (sortBy === 'recent') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      return 0;
    });

    setFilteredCustomers(filtered);
  }, [searchQuery, customers, sortBy]);

  const formatCurrency = (amount: number) => {
    return AnalyticsService.formatCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return AnalyticsService.formatDate(dateString);
  };

  const getVisitFrequency = (customer: CustomerAnalytics) => {
    return AnalyticsService.getVisitFrequency(customer);
  };

  const handleCustomerPress = (customer: CustomerAnalytics) => {
    navigation.navigate('CustomerDetails', { customerPhone: customer.phone });
  };

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalVisits = customers.reduce((sum, c) => sum + c.visitCount, 0);
  const averageOrderValue = totalVisits > 0 ? totalRevenue / totalVisits : 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2">Customers</Typography>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Typography variant="h3">{totalCustomers}</Typography>
          <Typography variant="caption" color={Colors.textLight}>Total Customers</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="h3">{formatCurrency(totalRevenue)}</Typography>
          <Typography variant="caption" color={Colors.textLight}>Total Revenue</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="h3">{totalVisits}</Typography>
          <Typography variant="caption" color={Colors.textLight}>Total Orders</Typography>
        </View>
        <View style={styles.statBox}>
          <Typography variant="h3">{formatCurrency(averageOrderValue)}</Typography>
          <Typography variant="caption" color={Colors.textLight}>Avg Order Value</Typography>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={mediumScale(20)} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'revenue' && styles.sortButtonActive]}
            onPress={() => setSortBy('revenue')}
          >
            <Typography
              variant="body"
              color={sortBy === 'revenue' ? Colors.white : Colors.primary}
            >
              Top Revenue
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'visits' && styles.sortButtonActive]}
            onPress={() => setSortBy('visits')}
          >
            <Typography
              variant="body"
              color={sortBy === 'visits' ? Colors.white : Colors.primary}
            >
              Most Visits
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortBy('recent')}
          >
            <Typography
              variant="body"
              color={sortBy === 'recent' ? Colors.white : Colors.primary}
            >
              Recent
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Customers List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredCustomers.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No Customers Found' : 'No Customers Yet'}
            message={searchQuery ? 'Try a different search term.' : 'Start creating invoices to see customer analytics.'}
          />
        ) : (
          filteredCustomers.map((customer, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleCustomerPress(customer)}
              activeOpacity={0.7}
            >
              <Card style={styles.customerCard}>
                {/* Customer Header */}
                <View style={styles.customerHeader}>
                  <View style={styles.customerInfo}>
                    <Typography variant="h3">{customer.name}</Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      {customer.phone}
                    </Typography>
                  </View>
                  <View style={styles.frequencyBadge}>
                    <Typography variant="caption" color={Colors.primary}>
                      {getVisitFrequency(customer)}
                    </Typography>
                  </View>
                </View>

                {/* Revenue & Visits */}
                <View style={styles.customerStats}>
                  <View style={styles.statItem}>
                    <Typography variant="h3" style={{ color: Colors.success }}>
                      {formatCurrency(customer.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      Total Revenue
                    </Typography>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Typography variant="h3">{customer.visitCount}</Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      Total Visits
                    </Typography>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Typography variant="h3" style={{ color: Colors.primary }}>
                      {formatCurrency(customer.totalProfit)}
                    </Typography>
                    <Typography variant="caption" color={Colors.textLight}>
                      Total Profit
                    </Typography>
                  </View>
                </View>

                {/* Last Visit */}
                <View style={styles.lastVisit}>
                  <Icon name="info" size={mediumScale(14)} style={{ tintColor: Colors.textLight }} />
                  <Typography variant="caption" color={Colors.textLight}>
                    Last visit: {formatDate(customer.lastVisit)}
                  </Typography>
                </View>

                {/* Top Products */}
                {customer.topProducts.length > 0 && (
                  <View style={styles.topProducts}>
                    <Typography variant="caption" color={Colors.textLight} style={styles.topProductsLabel}>
                      Top purchases:
                    </Typography>
                    <View style={styles.productTags}>
                      {customer.topProducts.slice(0, 3).map((product, idx) => (
                        <View key={idx} style={styles.productTag}>
                          <Typography variant="caption">
                            {product.name} ({product.quantity})
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + heightScale(20),
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: '#E0E0E0',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: '#E0E0E0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: mediumScale(12),
    paddingHorizontal: Spacing.md,
    height: heightScale(48),
  },
  searchIcon: {
    tintColor: Colors.textLight,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: mediumScale(16),
    color: Colors.textPrimary,
  },
  sortContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: '#E0E0E0',
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: mediumScale(20),
    borderWidth: mediumScale(1),
    borderColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  customerCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  frequencyBadge: {
    backgroundColor: Colors.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: heightScale(4),
    borderRadius: mediumScale(12),
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: mediumScale(1),
    borderBottomWidth: mediumScale(1),
    borderColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: widthScale(1),
    backgroundColor: '#E0E0E0',
  },
  lastVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  topProducts: {
    marginTop: Spacing.sm,
  },
  topProductsLabel: {
    marginBottom: Spacing.xs,
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  productTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: heightScale(4),
    borderRadius: mediumScale(8),
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
