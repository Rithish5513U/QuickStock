import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice, InvoiceItem } from '../models';

// Re-export for backward compatibility
export { Invoice, InvoiceItem };

const INVOICES_KEY = '@inventory_invoices';

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const data = await AsyncStorage.getItem(INVOICES_KEY);
    const invoices = data ? JSON.parse(data) : [];
    return invoices.sort((a: Invoice, b: Invoice) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
};

export const saveInvoice = async (invoice: Invoice): Promise<boolean> => {
  try {
    const invoices = await getInvoices();
    invoices.push(invoice);
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    return true;
  } catch (error) {
    console.error('Error saving invoice:', error);
    return false;
  }
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    const invoices = await getInvoices();
    const filteredInvoices = invoices.filter(inv => inv.id !== id);
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(filteredInvoices));
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
};
