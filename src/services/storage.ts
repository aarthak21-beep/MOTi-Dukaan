import { 
  Shop, Customer, Product, Sale, SaleItem, Payment, Expense, StockMovement 
} from '../types';
import { databases, APPWRITE_CONFIG, ID, Query } from './appwrite';
import { 
  SEED_SHOP, SEED_CUSTOMERS, SEED_PRODUCTS, SEED_EXPENSES 
} from './seedData';

const LOCAL_STORAGE_KEY_PREFIX = 'moti_dukaan_';

function isAppwriteActive(): boolean {
  return Boolean(
    APPWRITE_CONFIG.projectId && 
    APPWRITE_CONFIG.databaseId && 
    APPWRITE_CONFIG.projectId !== 'moti-dukaan' && // Not placeholder
    typeof window !== 'undefined' && 
    navigator.onLine
  );
}

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage for key', key, e);
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage for key', key, e);
  }
}

// Initializer for local storage if empty
export function initLocalStorage(): void {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'initialized')) {
    setLocal('shops', [SEED_SHOP]);
    setLocal('customers', SEED_CUSTOMERS);
    setLocal('products', SEED_PRODUCTS);
    setLocal('expenses', SEED_EXPENSES);
    setLocal('sales', []);
    setLocal('payments', []);
    setLocal('stock_movements', []);
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + 'initialized', 'true');
  }
}

// Ensure initialized on module load
initLocalStorage();

// ==================== SHOPS ====================

export async function getShop(shopId: string): Promise<Shop | null> {
  if (isAppwriteActive()) {
    try {
      const doc = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.shops,
        shopId
      );
      return doc as unknown as Shop;
    } catch (e) {
      console.warn('Appwrite getShop failed, falling back to local', e);
    }
  }

  const shops = getLocal<Shop[]>('shops', [SEED_SHOP]);
  return shops.find(s => s.$id === shopId) || shops[0] || SEED_SHOP;
}

export async function updateShop(shop: Shop): Promise<Shop> {
  if (isAppwriteActive() && shop.$id) {
    try {
      const doc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.shops,
        shop.$id,
        shop
      );
      return doc as unknown as Shop;
    } catch (e) {
      console.warn('Appwrite updateShop failed, updating local', e);
    }
  }

  const shops = getLocal<Shop[]>('shops', [SEED_SHOP]);
  const index = shops.findIndex(s => s.$id === shop.$id);
  if (index >= 0) {
    shops[index] = shop;
  } else {
    shops.push(shop);
  }
  setLocal('shops', shops);
  return shop;
}

// ==================== CUSTOMERS ====================

export async function getCustomers(shopId: string): Promise<Customer[]> {
  if (isAppwriteActive()) {
    try {
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.customers,
        [Query.equal('shopId', shopId), Query.orderDesc('$createdAt')]
      );
      return res.documents as unknown as Customer[];
    } catch (e) {
      console.warn('Appwrite getCustomers failed, falling back to local', e);
    }
  }

  const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  return customers.filter(c => c.shopId === shopId);
}

export async function createCustomer(customer: Omit<Customer, '$id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalUdhar' | 'totalPaid' | 'currentBalance'>): Promise<Customer> {
  const newCustomer: Customer = {
    ...customer,
    $id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    totalPurchases: 0,
    totalUdhar: 0,
    totalPaid: 0,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isAppwriteActive()) {
    try {
      const doc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.customers,
        ID.unique(),
        newCustomer
      );
      return doc as unknown as Customer;
    } catch (e) {
      console.warn('Appwrite createCustomer failed, saving local', e);
    }
  }

  const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  customers.unshift(newCustomer);
  setLocal('customers', customers);
  return newCustomer;
}

export async function updateCustomer(customer: Customer): Promise<Customer> {
  customer.updatedAt = new Date().toISOString();

  if (isAppwriteActive() && customer.$id) {
    try {
      const doc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.customers,
        customer.$id,
        customer
      );
      return doc as unknown as Customer;
    } catch (e) {
      console.warn('Appwrite updateCustomer failed, updating local', e);
    }
  }

  const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  const index = customers.findIndex(c => c.$id === customer.$id);
  if (index >= 0) {
    customers[index] = customer;
    setLocal('customers', customers);
  }
  return customer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  if (isAppwriteActive()) {
    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.customers,
        id
      );
    } catch (e) {
      console.warn('Appwrite deleteCustomer failed', e);
    }
  }

  const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  setLocal('customers', customers.filter(c => c.$id !== id));
  return true;
}

// ==================== PRODUCTS ====================

export async function getProducts(shopId: string): Promise<Product[]> {
  if (isAppwriteActive()) {
    try {
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products,
        [Query.equal('shopId', shopId), Query.limit(100)]
      );
      return res.documents as unknown as Product[];
    } catch (e) {
      console.warn('Appwrite getProducts failed, falling back to local', e);
    }
  }

  const products = getLocal<Product[]>('products', SEED_PRODUCTS);
  return products.filter(p => p.shopId === shopId);
}

export async function createProduct(product: Omit<Product, '$id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    $id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isAppwriteActive()) {
    try {
      const doc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products,
        ID.unique(),
        newProduct
      );
      return doc as unknown as Product;
    } catch (e) {
      console.warn('Appwrite createProduct failed, saving local', e);
    }
  }

  const products = getLocal<Product[]>('products', SEED_PRODUCTS);
  products.unshift(newProduct);
  setLocal('products', products);

  // Record initial stock movement
  if (newProduct.stock > 0) {
    recordStockMovement({
      shopId: newProduct.shopId,
      productId: newProduct.$id,
      productName: newProduct.name,
      movementType: 'purchase',
      quantity: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      notes: 'आरंभीचा उपलब्ध साठा (Initial Stock)',
    });
  }

  return newProduct;
}

export async function updateProduct(product: Product): Promise<Product> {
  product.updatedAt = new Date().toISOString();

  if (isAppwriteActive() && product.$id) {
    try {
      const doc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products,
        product.$id,
        product
      );
      return doc as unknown as Product;
    } catch (e) {
      console.warn('Appwrite updateProduct failed, updating local', e);
    }
  }

  const products = getLocal<Product[]>('products', SEED_PRODUCTS);
  const index = products.findIndex(p => p.$id === product.$id);
  if (index >= 0) {
    products[index] = product;
    setLocal('products', products);
  }
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isAppwriteActive()) {
    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products,
        id
      );
    } catch (e) {
      console.warn('Appwrite deleteProduct failed', e);
    }
  }

  const products = getLocal<Product[]>('products', SEED_PRODUCTS);
  setLocal('products', products.filter(p => p.$id !== id));
  return true;
}

// ==================== STOCK MOVEMENTS ====================

export async function recordStockMovement(movement: Omit<StockMovement, '$id' | 'createdAt'>): Promise<StockMovement> {
  const newMovement: StockMovement = {
    ...movement,
    $id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  const movements = getLocal<StockMovement[]>('stock_movements', []);
  movements.unshift(newMovement);
  setLocal('stock_movements', movements);

  if (isAppwriteActive()) {
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.stock_movements,
        ID.unique(),
        newMovement
      );
    } catch (e) {
      console.warn('Appwrite recordStockMovement error', e);
    }
  }

  return newMovement;
}

export async function getStockMovements(shopId: string, productId?: string): Promise<StockMovement[]> {
  const movements = getLocal<StockMovement[]>('stock_movements', []);
  return movements.filter(m => m.shopId === shopId && (!productId || m.productId === productId));
}

export async function adjustStock(
  shopId: string, 
  productId: string, 
  newStock: number, 
  reason: string
): Promise<Product | null> {
  const products = await getProducts(shopId);
  const prod = products.find(p => p.$id === productId);
  if (!prod) return null;

  const prevStock = prod.stock;
  const diff = newStock - prevStock;
  prod.stock = Math.max(0, newStock);
  await updateProduct(prod);

  await recordStockMovement({
    shopId,
    productId,
    productName: prod.name,
    movementType: diff >= 0 ? 'purchase' : 'adjustment',
    quantity: Math.abs(diff),
    previousStock: prevStock,
    newStock: prod.stock,
    notes: reason || 'साठा दुरुस्ती (Adjustment)',
  });

  return prod;
}

// ==================== SALES & BILLING ====================

export async function createSale(
  saleData: Omit<Sale, '$id' | 'createdAt' | 'invoiceNumber'>
): Promise<Sale> {
  // Generate invoice number e.g. MOTI-20261112-001
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sales = getLocal<Sale[]>('sales', []);
  const todayCount = sales.filter(s => s.createdAt.startsWith(new Date().toISOString().slice(0, 10))).length + 1;
  const invoiceNumber = `MOTI-${todayStr}-${String(todayCount).padStart(3, '0')}`;

  const newSale: Sale = {
    ...saleData,
    $id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    invoiceNumber,
    createdAt: new Date().toISOString(),
  };

  // 1. Deduct Product Stock & Log Stock Movements
  const products = getLocal<Product[]>('products', SEED_PRODUCTS);
  for (const item of newSale.items) {
    const prodIndex = products.findIndex(p => p.$id === item.productId);
    if (prodIndex >= 0) {
      const prod = products[prodIndex];
      const prevStock = prod.stock;
      prod.stock = Math.max(0, prod.stock - item.quantity);
      products[prodIndex] = prod;

      recordStockMovement({
        shopId: newSale.shopId,
        productId: prod.$id,
        productName: prod.name,
        movementType: 'sale',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: prod.stock,
        referenceId: newSale.$id,
        notes: `बिल क्र. ${invoiceNumber}`,
      });
    }
  }
  setLocal('products', products);

  // 2. Customer Ledger Updates (if customer is selected)
  if (newSale.customerId) {
    const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
    const custIndex = customers.findIndex(c => c.$id === newSale.customerId);
    if (custIndex >= 0) {
      const cust = customers[custIndex];
      cust.totalPurchases += newSale.totalAmount;

      if (newSale.paymentMethod === 'udhar' || newSale.dueAmount > 0) {
        cust.totalUdhar += newSale.dueAmount;
        cust.currentBalance += newSale.dueAmount;
      }
      if (newSale.paidAmount > 0) {
        cust.totalPaid += newSale.paidAmount;
      }
      cust.updatedAt = new Date().toISOString();
      customers[custIndex] = cust;
      setLocal('customers', customers);
    }
  }

  // 3. Record Payment if paid
  if (newSale.paidAmount > 0) {
    recordPayment({
      shopId: newSale.shopId,
      customerId: newSale.customerId || 'walk_in',
      customerName: newSale.customerName || 'रोख गिऱ्हाईक (Walk-in)',
      saleId: newSale.$id,
      amount: newSale.paidAmount,
      paymentMethod: (newSale.paymentMethod === 'upi') ? 'upi' : 'cash',
      paymentDate: new Date().toISOString(),
      notes: `बिल क्र. ${invoiceNumber} अंतर्गत भरणा`,
    });
  }

  // 4. Save Sale locally
  sales.unshift(newSale);
  setLocal('sales', sales);

  // 5. Appwrite Cloud sync if active
  if (isAppwriteActive()) {
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.sales,
        ID.unique(),
        {
          ...newSale,
          items: JSON.stringify(newSale.items),
        }
      );
    } catch (e) {
      console.warn('Appwrite createSale error', e);
    }
  }

  return newSale;
}

export async function getSales(shopId: string): Promise<Sale[]> {
  const sales = getLocal<Sale[]>('sales', []);
  return sales.filter(s => s.shopId === shopId);
}

// ==================== PAYMENTS (जमा पावती) ====================

export async function recordPayment(paymentData: Omit<Payment, '$id' | 'createdAt'>): Promise<Payment> {
  const newPayment: Payment = {
    ...paymentData,
    $id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  // If customer is a registered customer, update their balance
  if (newPayment.customerId && newPayment.customerId !== 'walk_in') {
    const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
    const custIndex = customers.findIndex(c => c.$id === newPayment.customerId);
    if (custIndex >= 0) {
      const cust = customers[custIndex];
      cust.totalPaid += newPayment.amount;
      cust.currentBalance = Math.max(0, cust.currentBalance - newPayment.amount);
      cust.updatedAt = new Date().toISOString();
      customers[custIndex] = cust;
      setLocal('customers', customers);
    }
  }

  const payments = getLocal<Payment[]>('payments', []);
  payments.unshift(newPayment);
  setLocal('payments', payments);

  if (isAppwriteActive()) {
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.payments,
        ID.unique(),
        newPayment
      );
    } catch (e) {
      console.warn('Appwrite recordPayment error', e);
    }
  }

  return newPayment;
}

export async function addUdharEntry(
  shopId: string,
  customerId: string,
  amount: number,
  notes?: string
): Promise<Customer | null> {
  if (amount <= 0) return null;

  const customers = getLocal<Customer[]>('customers', SEED_CUSTOMERS);
  const custIndex = customers.findIndex(c => c.$id === customerId);
  if (custIndex < 0) return null;

  const cust = customers[custIndex];
  cust.totalUdhar += amount;
  cust.currentBalance += amount;
  cust.updatedAt = new Date().toISOString();
  customers[custIndex] = cust;
  setLocal('customers', customers);

  // Also record a synthetic sale/ledger entry for traceability
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sales = getLocal<Sale[]>('sales', []);
  const todayCount = sales.length + 1;
  const invoiceNumber = `UDHAR-${todayStr}-${String(todayCount).padStart(3, '0')}`;

  const udharSale: Sale = {
    $id: 'udhar_' + Date.now(),
    shopId,
    customerId,
    customerName: cust.name,
    customerMobile: cust.mobile,
    invoiceNumber,
    subtotal: amount,
    discount: 0,
    totalAmount: amount,
    paidAmount: 0,
    dueAmount: amount,
    paymentMethod: 'udhar',
    paymentStatus: 'pending',
    items: [
      {
        productId: 'custom_udhar',
        productNameSnapshot: notes || 'थेट उधार नोंद (Direct Credit)',
        quantity: 1,
        unit: 'piece',
        unitPrice: amount,
        purchasePriceSnapshot: 0,
        total: amount,
      }
    ],
    notes: notes || 'खाते वही उधार नोंद',
    createdAt: new Date().toISOString(),
  };
  sales.unshift(udharSale);
  setLocal('sales', sales);

  return cust;
}

export async function getPayments(shopId: string, customerId?: string): Promise<Payment[]> {
  const payments = getLocal<Payment[]>('payments', []);
  return payments.filter(p => p.shopId === shopId && (!customerId || p.customerId === customerId));
}

// ==================== EXPENSES ====================

export async function getExpenses(shopId: string): Promise<Expense[]> {
  const expenses = getLocal<Expense[]>('expenses', SEED_EXPENSES);
  return expenses.filter(e => e.shopId === shopId);
}

export async function createExpense(expense: Omit<Expense, '$id' | 'createdAt'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    $id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  const expenses = getLocal<Expense[]>('expenses', SEED_EXPENSES);
  expenses.unshift(newExpense);
  setLocal('expenses', expenses);

  if (isAppwriteActive()) {
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        ID.unique(),
        newExpense
      );
    } catch (e) {
      console.warn('Appwrite createExpense error', e);
    }
  }

  return newExpense;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const expenses = getLocal<Expense[]>('expenses', SEED_EXPENSES);
  setLocal('expenses', expenses.filter(e => e.$id !== id));

  if (isAppwriteActive()) {
    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        id
      );
    } catch (e) {
      console.warn('Appwrite deleteExpense error', e);
    }
  }

  return true;
}
