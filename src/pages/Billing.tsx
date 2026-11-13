import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  Receipt, 
  Printer, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getProducts, 
  getCustomers, 
  createSale, 
  createCustomer 
} from '../services/storage';
import { Product, Customer, Sale, SaleItem, PaymentMethod } from '../types';
import { ReceiptModal } from '../components/billing/ReceiptModal';
import { Modal } from '../components/common/Modal';

export const Billing: React.FC = () => {
  const { t, formatCurrency } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter / Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart / Bill State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>(''); // For change return or split
  const [billNotes, setBillNotes] = useState<string>('');

  // Generated Sale & Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Quick New Customer Modal
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, custs] = await Promise.all([
        getProducts(shopId),
        getCustomers(shopId),
      ]);
      setProducts(prods);
      setCustomers(custs);
    } catch (e) {
      console.error('Failed to load products/customers for billing', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Categories list
  const categories = [
    { id: 'all', label: 'सर्व वस्तू (All)' },
    { id: 'groceries', label: t.cat_groceries },
    { id: 'pulses', label: t.cat_pulses },
    { id: 'oil_ghee', label: t.cat_oil_ghee },
    { id: 'spices', label: t.cat_spices },
    { id: 'snacks', label: t.cat_snacks },
    { id: 'soaps_cleaning', label: t.cat_soaps_cleaning },
    { id: 'beverages', label: t.cat_beverages },
  ];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  // Cart Operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.$id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.$id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.$id,
            productNameSnapshot: product.name,
            quantity: 1,
            unit: product.unit,
            unitPrice: product.sellingPrice,
            purchasePriceSnapshot: product.purchasePrice,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
              total: Math.round(newQty * item.unitPrice * 100) / 100,
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const setExactQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: qty, total: Math.round(qty * item.unitPrice * 100) / 100 }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaymentMethod('cash');
    setCashGiven('');
    setSelectedCustomerId('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = Math.max(0, subtotal - (discountAmount || 0));

  let paidAmount = finalAmount;
  let dueAmount = 0;

  if (paymentMethod === 'udhar') {
    paidAmount = 0;
    dueAmount = finalAmount;
  } else if (paymentMethod === 'split') {
    const cash = parseFloat(cashGiven) || 0;
    paidAmount = Math.min(finalAmount, Math.max(0, cash));
    dueAmount = Math.max(0, finalAmount - paidAmount);
  }

  // Handle Quick Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) return;

    const created = await createCustomer({
      shopId,
      name: newCustName,
      mobile: newCustMobile,
      address: newCustAddress,
    });

    setCustomers(prev => [created, ...prev]);
    setSelectedCustomerId(created.$id);
    setShowNewCustModal(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
  };

  // Finalize Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    // If Udhar or Split with due amount, customer is MANDATORY!
    if ((paymentMethod === 'udhar' || (paymentMethod === 'split' && dueAmount > 0)) && !selectedCustomerId) {
      alert('उधार बिलासाठी ग्राहक निवडणे आवश्यक आहे! कृपया ग्राहक निवडा किंवा नवीन जोडा.');
      return;
    }

    const selectedCust = customers.find(c => c.$id === selectedCustomerId);

    const sale = await createSale({
      shopId,
      customerId: selectedCustomerId || undefined,
      customerName: selectedCust ? selectedCust.name : t.walkInCustomer,
      customerMobile: selectedCust ? selectedCust.mobile : undefined,
      subtotal,
      discount: discountAmount || 0,
      totalAmount: finalAmount,
      paidAmount,
      dueAmount,
      paymentMethod,
      paymentStatus: dueAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'pending'),
      items: cart,
      notes: billNotes,
    });

    setCompletedSale(sale);
    clearCart();
    loadData(); // Refresh product stock & customer balances
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Page Title */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <span>{t.billingTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            एका टॅपमध्ये जलद बिल तयार करा, साठा आपोआप वजा होईल.
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="self-start sm:self-auto text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition"
          >
            बिल रीसेट करा (Clear)
          </button>
        )}
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Product Catalog & Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchProductPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs font-medium"
            />
          </div>

          {/* Category Filter Pills (Interactive Segmented buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
                कोणतीही वस्तू आढळली नाही. कृपया वस्तूचे नाव किंवा बारकोड तपासा.
              </div>
            ) : (
              filteredProducts.map(product => {
                const inCartItem = cart.find(i => i.productId === product.$id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.$id}
                    type="button"
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3 text-left bg-white rounded-xl border transition flex flex-col justify-between group relative ${
                      inCartItem
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                        : isOutOfStock
                        ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                        : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    {inCartItem && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {inCartItem.quantity}
                      </span>
                    )}

                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 line-clamp-2 leading-tight">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        साठा: <span className="font-semibold tabular-nums">{product.stock} {product.unit}</span>
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-800 tabular-nums">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400">/{product.unit}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Bill & Checkout Sheet (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5 flex flex-col">
          {/* Customer Selection */}
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t.selectCustomer}
              </label>
              <button
                type="button"
                onClick={() => setShowNewCustModal(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>नवीन जोडा</span>
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- {t.walkInCustomer} --</option>
              {customers.map(c => (
                <option key={c.$id} value={c.$id}>
                  {c.name} ({c.mobile}) {c.currentBalance > 0 ? `[उधार: ₹${c.currentBalance}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 py-3 overflow-y-auto max-h-64 min-h-[160px] divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                {t.emptyBill}
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate leading-tight">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      ₹{item.unitPrice} × {item.quantity} {item.unit}
                    </p>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white text-slate-700 rounded hover:bg-slate-200 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold tabular-nums text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white text-slate-700 rounded hover:bg-slate-200 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-16 text-right font-extrabold text-slate-900 tabular-nums shrink-0">
                    ₹{item.total}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bill Calculation & Discounts */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t.subtotal}:</span>
              <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">{t.discount} (₹):</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-right px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">{t.finalAmount}:</span>
              <span className="text-xl font-black text-emerald-800 tabular-nums">
                {formatCurrency(finalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Segmented Selector */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span className="truncate">रोख (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'upi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="truncate">UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('udhar')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'udhar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">उधार</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === 'split'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="truncate">स्प्लिट</span>
              </button>
            </div>

            {/* Split Details Input */}
            {paymentMethod === 'split' && (
              <div className="mt-2.5 p-3 bg-teal-50 rounded-xl border border-teal-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-900">{t.cashPaid} (₹):</span>
                  <input
                    type="number"
                    min="0"
                    max={finalAmount}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="उदा. 200"
                    className="w-28 text-right px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-900 focus:outline-none"
                  />
                </div>
                <div className="flex justify-between text-teal-800">
                  <span>{t.udharAmount}:</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(dueAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Checkout CTA */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCompleteSale}
            className="mt-4 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t.completeSale}</span>
          </button>
        </div>
      </div>

      {/* Generated Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
        sale={completedSale}
        shop={shop}
      />

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={showNewCustModal}
        onClose={() => setShowNewCustModal(false)}
        title={t.actionAddCustomer}
        subtitle="नवीन ग्राहकाचे नाव व संपर्क नोंदवा"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerName} *</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="उदा. सुनील कांबळे"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerMobile} *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerAddress}</label>
            <input
              type="text"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              placeholder="पत्ता"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewCustModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {t.actionSave}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
