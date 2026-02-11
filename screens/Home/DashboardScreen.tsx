import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, Alert, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import Typography from '../../components/Typography';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import ProductCard from '../../components/ProductCard';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Product } from '../../models';
import { ProductService, AnalyticsService } from '../../services';

interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  totalProfit: number;
  totalRevenue: number;
  avgProfitMargin: number;
  totalCategories: number;
  lowStockCount: number;
  criticalStockCount: number;
  outOfStockCount: number;
  recentProducts: Product[];
  categoryData: { name: string; population: number; color: string; legendFontColor: string; legendFontSize: number; }[];
  stockStatusData: { labels: string[]; datasets: { data: number[] }[] };
  trendData: { labels: string[]; datasets: {
    revenue: number[];
    profit: number[];
    soldStocks: number[]; data: number[]; color?: (opacity: number) => string; strokeWidth?: number 
}[] };
}

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStockValue: 0,
    totalProfit: 0,
    totalRevenue: 0,
    avgProfitMargin: 0,
    totalCategories: 0,
    lowStockCount: 0,
    criticalStockCount: 0,
    outOfStockCount: 0,
    recentProducts: [],
    categoryData: [],
    stockStatusData: { labels: [], datasets: [{ data: [] }] },
    trendData: { labels: [], datasets: [] },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'profit' | 'soldStocks'>('revenue');

  const loadDashboardData = async () => {
    try {
      const products = await ProductService.getAll();
      
      // Calculate stats using AnalyticsService
      const totalProducts = products.length;
      const totalStockValue = AnalyticsService.calculateInventoryValue(products);
      const totalRevenue = AnalyticsService.calculateTotalRevenue(products);
      const totalProfit = AnalyticsService.calculateTotalProfit(products);
      const avgProfitMargin = AnalyticsService.calculateAverageProfitMargin(products);
      const totalCategories = new Set(products.map(p => p.category)).size;
      
      const lowStockCount = AnalyticsService.getLowStockCount(products);
      const criticalStockCount = AnalyticsService.getCriticalStockCount(products);
      const outOfStockCount = AnalyticsService.getOutOfStockCount(products);
      
      // Get 5 most recently added products
      const recentProducts = [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Prepare category distribution data
      const categoryMap = new Map<string, number>();
      products.forEach(p => {
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      });
      
      const chartColors = ['#4A90E2', '#E94B3C', '#6FCF97', '#F2994A', '#9B51E0', '#56CCF2'];
      const categoryData = Array.from(categoryMap.entries()).map(([name, count], index) => ({
        name,
        population: count,
        color: chartColors[index % chartColors.length],
        legendFontColor: Colors.textPrimary,
        legendFontSize: 12,
      }));

      // Prepare stock status data
      const goodStockCount = products.filter(p => 
        p.currentStock > p.minStock
      ).length;
      
      const stockStatusData = {
        labels: ['Good', 'Low', 'Out'],
        datasets: [{
          data: [goodStockCount, lowStockCount, outOfStockCount]
        }]
      };

      // Prepare lifetime trend data grouped by week
      const weeklyData = new Map<string, { revenue: number; profit: number; soldStocks: number }>();
      
      products.forEach(p => {
        const productDate = new Date(p.createdAt);
        const weekStart = new Date(productDate);
        weekStart.setDate(productDate.getDate() - productDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        const revenue = p.revenue || 0;
        const profit = p.profit || 0;
        const soldUnits = p.soldUnits || 0;
        
        const existing = weeklyData.get(weekKey) || { revenue: 0, profit: 0, soldStocks: 0 };
        weeklyData.set(weekKey, {
          revenue: existing.revenue + revenue,
          profit: existing.profit + profit,
          soldStocks: existing.soldStocks + soldUnits
        });
      });
      
      const sortedWeeks = Array.from(weeklyData.keys()).sort();
      const last6Weeks = sortedWeeks.slice(-6);
      
      const weekLabels = last6Weeks.map(weekKey => {
        const date = new Date(weekKey);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      
      const weeklyRevenue = last6Weeks.map(week => weeklyData.get(week)?.revenue || 0);
      const weeklyProfit = last6Weeks.map(week => weeklyData.get(week)?.profit || 0);
      const weeklySoldStocks = last6Weeks.map(week => weeklyData.get(week)?.soldStocks || 0);

      const trendData = {
        labels: weekLabels.length > 0 ? weekLabels : ['Week 1'],
        datasets: [
          {
            data: weeklyRevenue.length > 0 ? weeklyRevenue : [0],
            revenue: weeklyRevenue,
            profit: weeklyProfit,
            soldStocks: weeklySoldStocks,
            color: (opacity = 1) => `rgba(41, 151, 255, ${opacity})`,
            strokeWidth: 2
          }
        ]
      };

      setStats({
        totalProducts,
        totalStockValue,
        totalProfit,
        totalRevenue,
        avgProfitMargin,
        totalCategories,
        lowStockCount,
        criticalStockCount,
        outOfStockCount,
        recentProducts,
        categoryData,
        stockStatusData,
        trendData,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const getChartData = () => {
    const dataset = stats.trendData.datasets[0];
    let data: number[] = [];
    
    if (selectedMetric === 'revenue') {
      data = dataset.revenue || [];
    } else if (selectedMetric === 'profit') {
      data = dataset.profit || [];
    } else {
      data = dataset.soldStocks || [];
    }
    
    return {
      labels: stats.trendData.labels,
      datasets: [{ data: data.length > 0 ? data : [0] }]
    };
  };

  const getMetricLabel = () => {
    if (selectedMetric === 'revenue') return 'Revenue';
    if (selectedMetric === 'profit') return 'Profit';
    return 'Sold Stocks';
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails' as never, { productId: product.id } as never);
  };

  const handleProductDelete = async (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.delete(product.id);
              await loadDashboardData();
            } catch (error) {
              console.error('Error deleting product:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography variant="h2">Dashboard</Typography>
          <Typography variant="subtitle">Welcome back to QuickStock</Typography>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            number={stats.totalProducts.toString()} 
            label="Total Products" 
            backgroundColor={Colors.blue1} 
          />
          <StatCard 
            number={formatCurrency(stats.totalStockValue)} 
            label="Stock Value" 
            backgroundColor={Colors.blue2} 
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard 
            number={formatCurrency(stats.totalRevenue)} 
            label="Total Revenue" 
            backgroundColor={Colors.blue3} 
          />
          <StatCard 
            number={formatCurrency(stats.totalProfit)} 
            label="Total Profit" 
            backgroundColor={Colors.blue4} 
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard 
            number={`${stats.avgProfitMargin.toFixed(1)}%`} 
            label="Profit Margin" 
            backgroundColor={Colors.blue5} 
          />
          <StatCard 
            number={stats.totalCategories.toString()} 
            label="Categories" 
            backgroundColor={Colors.blue6} 
          />
        </View>

        {/* Charts Section */}
        {stats.totalProducts > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" color={Colors.primary} style={styles.sectionTitle}>
              Analytics
            </Typography>
            
            {/* Products by Category */}
            {stats.categoryData.length > 0 && (
              <Card style={styles.chartCard}>
                <Typography variant="body" style={styles.chartTitle}>
                  Products by Category
                </Typography>
                <PieChart
                  data={stats.categoryData}
                  width={Dimensions.get('window').width - Spacing.lg * 4}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </Card>
            )}

            {/* Trend Chart */}
            <Card style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Typography variant="body" style={styles.chartTitle}>
                  Lifetime {getMetricLabel()} Trend
                </Typography>
                <View style={styles.pickerContainer}>
                  <View style={styles.dropdown}>
                    <Picker
                      selectedValue={selectedMetric}
                      onValueChange={(value) => setSelectedMetric(value)}
                      style={styles.picker}
                      dropdownIconColor={Colors.primary}
                    >
                      <Picker.Item label="Revenue" value="revenue" />
                      <Picker.Item label="Profit" value="profit" />
                      <Picker.Item label="Sold Stocks" value="soldStocks" />
                    </Picker>
                  </View>
                </View>
              </View>
              <LineChart
                data={getChartData()}
                width={Dimensions.get('window').width - Spacing.lg * 4}
                height={220}
                chartConfig={{
                  backgroundColor: Colors.white,
                  backgroundGradientFrom: Colors.white,
                  backgroundGradientTo: Colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                  },
                }}
                bezier
                style={styles.chart}
                yAxisLabel={selectedMetric === 'soldStocks' ? '' : '$'}
                yAxisSuffix=""
              />
            </Card>

            {/* Stock Status */}
            <Card style={styles.chartCard}>
              <Typography variant="body" style={styles.chartTitle}>
                Stock Status Overview
              </Typography>
              <BarChart
                data={stats.stockStatusData}
                width={Dimensions.get('window').width - Spacing.lg * 4}
                height={200}
                chartConfig={{
                  backgroundColor: Colors.white,
                  backgroundGradientFrom: Colors.white,
                  backgroundGradientTo: Colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
              />
            </Card>
          </View>
        )}

        {/* Stock Alerts */}
        {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="alert" size={20} color={Colors.warning} />
              <Typography variant="h3" color={Colors.warning} style={styles.sectionTitle}>
                Stock Alerts
              </Typography>
            </View>
            <Card style={styles.alertCard}>
              {stats.criticalStockCount > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertDot, { backgroundColor: Colors.danger }]} />
                  <Typography variant="body">
                    {stats.criticalStockCount} product{stats.criticalStockCount > 1 ? 's' : ''} at critical level
                  </Typography>
                </View>
              )}
              {stats.lowStockCount > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertDot, { backgroundColor: Colors.warning }]} />
                  <Typography variant="body">
                    {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} running low
                  </Typography>
                </View>
              )}
              {stats.outOfStockCount > 0 && (
                <View style={styles.alertItem}>
                  <View style={[styles.alertDot, { backgroundColor: Colors.textLight }]} />
                  <Typography variant="body">
                    {stats.outOfStockCount} product{stats.outOfStockCount > 1 ? 's' : ''} out of stock
                  </Typography>
                </View>
              )}
              <TouchableOpacity 
                style={styles.alertAction}
                onPress={() => navigation.navigate('Products' as never)}
              >
                <Typography variant="body" color={Colors.primary}>
                  View All →
                </Typography>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Typography variant="h3" color={Colors.primary} style={styles.sectionTitle}>
            Quick Actions
          </Typography>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddEditProduct' as never)}
            >
              <Card style={styles.actionCard}>
                <Icon name="add" size={32} color={Colors.primary} />
                <Typography variant="body" color={Colors.primary} style={styles.actionButtonText}>
                  Add Product
                </Typography>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Bill' as never)}>
              <Card style={styles.actionCard}>
                <Icon name="receipt" size={32} color={Colors.primary} />
                <Typography variant="body" color={Colors.primary} style={styles.actionButtonText}>
                  Create Invoice
                </Typography>
              </Card>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Stock' as never)}>
              <Card style={styles.actionCard}>
                <Icon name="inventory" size={32} color={Colors.primary} />
                <Typography variant="body" color={Colors.primary} style={styles.actionButtonText}>
                  Update Stock
                </Typography>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.section}>
          <Typography variant="h3" color={Colors.primary} style={styles.sectionTitle}>
            Recently Added
          </Typography>
          {stats.recentProducts.length === 0 ? (
            <EmptyState 
              title="No products yet"
              message="Start by adding your first product"
            />
          ) : (
            <View>
              {stats.recentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={handleProductPress}
                  onEdit={() => navigation.navigate('AddEditProduct' as never, { product } as never)}
                  onDelete={handleProductDelete}
                />
              ))}
              {stats.totalProducts > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Products' as never)}
                >
                  <Typography variant="body" color={Colors.primary}>
                    View All Products →
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  alertCard: {
    padding: Spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertAction: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    alignItems: 'center',
  },
  actionButtonsContainer: {
    gap: Spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  chartCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  pickerContainer: {
    marginLeft: 'auto',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    height: 36,
    width: 130,
  },
  picker: {
    flex: 1,
    color: Colors.primary,
  },
  chart: {
    borderRadius: 16,
  },
});
