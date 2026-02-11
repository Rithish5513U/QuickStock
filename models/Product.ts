export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  buyingPrice: number;
  sellingPrice: number;
  minStock: number;
  criticalStock: number;
  sku?: string;
  barcode?: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  soldUnits?: number;
  revenue?: number;
  profit?: number;
}
