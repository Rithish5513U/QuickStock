import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer } from '../models';

// Re-export for backward compatibility
export { Customer };

const CUSTOMERS_KEY = '@inventory_customers';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const data = await AsyncStorage.getItem(CUSTOMERS_KEY);
    const customers = data ? JSON.parse(data) : [];
    return customers.sort((a: Customer, b: Customer) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
};

export const saveCustomer = async (customer: Customer): Promise<boolean> => {
  try {
    const customers = await getCustomers();
    customers.push(customer);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    return true;
  } catch (error) {
    console.error('Error saving customer:', error);
    return false;
  }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    const customers = await getCustomers();
    const filteredCustomers = customers.filter(c => c.id !== id);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filteredCustomers));
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
};
