import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/Home/DashboardScreen';
import ProductsListScreen from './screens/Products/ProductsListScreen';
import AddEditProductScreen from './screens/Products/AddEditProductScreen';
import ProductDetailsScreen from './screens/Products/ProductDetailsScreen';
import BillScreen from './screens/Bill/BillScreen';
import InvoiceHistoryScreen from './screens/Bill/InvoiceHistoryScreen';
import SelectProductScreen from './screens/Bill/SelectProductScreen';
import CustomerAnalyticsScreen from './screens/Customers/CustomerAnalyticsScreen';
import CustomerDetailsScreen from './screens/Customers/CustomerDetailsScreen';
import MoreScreen from './screens/More/MoreScreen';
import Icon from './components/Icon';
import { Colors } from './constants/colors';
import { heightScale, mediumScale } from './constants/size';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenWelcome');
      setHasSeenWelcome(value === 'true');
    } catch (error) {
      console.error('Error checking welcome status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasSeenWelcome ? 'MainTabs' : 'Welcome'}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="InvoiceHistory" component={InvoiceHistoryScreen} />
        <Stack.Screen name="SelectProduct" component={SelectProductScreen} />
        <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = 'store';
          } else if (route.name === 'Products') {
            iconName = 'shopping-bag-filled';
          } else if (route.name === 'Bill') {
            iconName = 'create';
          } else if (route.name === 'Customers') {
            iconName = 'user';
          } else if (route.name === 'More') {
            iconName = 'hamburger-menu';
          }

          return <Icon name={iconName} size={size} style={{ tintColor: color }} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: mediumScale(1),
          borderTopColor: '#E0E0E0',
          height: heightScale(60),
          paddingBottom: heightScale(8),
          paddingTop: heightScale(8),
        },
        tabBarLabelStyle: {
          fontSize: mediumScale(12),
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsListScreen} />
      <Tab.Screen 
        name="Bill" 
        component={BillScreen}
        options={{
          tabBarIconStyle: {
            marginTop: heightScale(-10),
          },
          tabBarLabelStyle: {
            fontSize: mediumScale(12),
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen name="Customers" component={CustomerAnalyticsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
