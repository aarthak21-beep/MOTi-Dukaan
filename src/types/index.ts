export type Language = 'mr' | 'en';

export interface Shop {
  $id?: string;
  ownerUserId: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber?: string;
  tagline?: string;
  lowStockAlertLimit: number;
  currency: string;
  createdAt: string;
}

export interface Customer {
  $id: string;
  shopId: string;
  name: string;
  mobile: string;
  address: string;
  notes?: string;
  totalPurchases: number;
  totalUdhar: number;
  totalPaid: number;
  currentBalance: number; // Positive means customer owes shop (Udhar)
  createdAt: string;
  updatedAt: string;
}

export type UnitType = 'piece' | 'packet' | 'kg' | 'gram' | 'litre' | 'ml' | 'box' | 'dozen';

export interface Product {
  $id: string;
  shopId: string;
  name: string;
  sku: string; // Barcode or SKU
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit: UnitType;
  lowStockLimit: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'udhar' | 'split';
export type PaymentStatus = 'paid' | 'partially_paid' | 'pending';

export interface SaleItem {
  $id?: string;
  saleId?: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  purchasePriceSnapshot: number;
  total: number;
}

export interface Sale {
  $id: string;
  shopId: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: SaleItem[];
  notes?: string;
  createdAt: string;
}

export interface Payment {
  $id: string;
  shopId: string;
  customerId: string;
  customerName?: string;
  saleId?: string;
  amount: number;
  paymentMethod: 'cash' | 'upi';
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'rent' 
  | 'electricity' 
  | 'transport' 
  | 'salary' 
  | 'purchase' 
  | 'maintenance' 
  | 'tea_snacks' 
  | 'other';

export interface Expense {
  $id: string;
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  createdAt: string;
}

export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'return';

export interface StockMovement {
  $id: string;
  shopId: string;
  productId: string;
  productName: string;
  movementType: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  shop: Shop;
}
