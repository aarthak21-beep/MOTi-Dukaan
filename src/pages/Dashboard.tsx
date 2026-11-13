import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Package, 
  AlertTriangle, 
  Plus, 
  Receipt, 
  Wallet, 
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getSales, 
  getExpenses, 
  getCustomers, 
  getProducts, 
  getPayments,
  createCustomer,
  createProduct,
  createExpense,
  addUdharEntry
} from '../services/storage';
import { Sale, Expense, Customer, Product, Payment } from '../types';
import { ReceiptModal } from '../components/billing/ReceiptModal';
import { Modal } from '../components/common/Modal';

export const Dashboard: React.FC = () => {
  const { t, formatCurrency, formatDate, formatDateTime, language } = useLanguage();
  const { shop } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Sale for printable receipt
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Quick Action Modals
  const [modalType, setModalType] = useState<'customer' | 'product' | 'udhar' | 'expense' | null>(null);

  // Quick Modal Forms State
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const [newProdName, setNewProdName] = useState('');
  const [newProdSKU, setNewProdSKU] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('groceries');
  const [newProdBuy, setNewProdBuy] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdUnit, setNewProdUnit] = useState<any>('piece');

  const [udharCustId, setUdharCustId] = useState('');
  const [udharAmount, setUdharAmount] = useState('');
  const [udharNotes, setUdharNotes] = useState('');

  const [expCategory, setExpCategory] = useState<any>('tea_snacks');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const shopId = shop?.$id || 'shop_moti_demo';

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, expData, custData, prodData, payData] = await Promise.all([
        getSales(shopId),
        getExpenses(shopId),
        getCustomers(shopId),
        getProducts(shopId),
        getPayments(shopId),
      ]);
      setSales(salesData);
      setExpenses(expData);
      setCustomers(custData);
      setProducts(prodData);
      setPayments(payData);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySalesList = sales.filter(s => s.createdAt.slice(0, 10) === todayStr);
  const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + s.totalAmount, 0);

  const todayExpensesList = expenses.filter(e => e.expenseDate.slice(0, 10) === todayStr || e.createdAt.slice(0, 10) === todayStr);
  const todayExpensesTotal = todayExpensesList.reduce((sum, e) => sum + e.amount, 0);

  // Estimated gross profit from today's sales (sellingPrice - purchasePrice) minus today's expenses
  let todayGrossMargin = 0;
  for (const s of todaySalesList) {
    for (const item of s.items) {
      const margin = (item.unitPrice - (item.purchasePriceSnapshot || 0)) * item.quantity;
      todayGrossMargin += Math.max(0, margin);
    }
    todayGrossMargin -= s.discount || 0;
  }
  const todayEstimatedProfit = Math.max(0, todayGrossMargin - todayExpensesTotal);

  const totalPendingUdhar = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const lowStockLimit = shop?.lowStockAlertLimit || 5;
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockLimit || lowStockLimit));

  // Last 7 days sales for trend chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const daySales = sales
      .filter(s => s.createdAt.slice(0, 10) === dayStr)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const dayName = d.toLocaleDateString('mr-IN', { weekday: 'short' });
    return { dayStr, daySales, dayName, dateNum: d.getDate() };
  });

  const maxDaySales = Math.max(...last7Days.map(d => d.daySales), 1000);

  // Quick Action Submissions
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) return;
    await createCustomer({
      shopId,
      name: newCustName,
      mobile: newCustMobile,
      address: newCustAddress,
    });
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
    setModalType(null);
    loadData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSell) return;
    await createProduct({
      shopId,
      name: newProdName,
      sku: newProdSKU || `SKU-${Date.now().toString().slice(-4)}`,
      category: newProdCategory,
      purchasePrice: parseFloat(newProdBuy) || 0,
      sellingPrice: parseFloat(newProdSell) || 0,
      stock: parseFloat(newProdStock) || 0,
      unit: newProdUnit,
      lowStockLimit: 5,
    });
    setNewProdName('');
    setNewProdSKU('');
    setNewProdBuy('');
    setNewProdSell('');
    setNewProdStock('');
    setModalType(null);
    loadData();
  };

  const handleAddUdhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udharCustId || !udharAmount) return;
    await addUdharEntry(shopId, udharCustId, parseFloat(udharAmount), udharNotes);
    setUdharCustId('');
    setUdharAmount('');
    setUdharNotes('');
    setModalType(null);
    loadData();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;
    await createExpense({
      shopId,
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
      description: expDesc || 'दैनिक खर्च',
      expenseDate: new Date().toISOString(),
    });
    setExpAmount('');
    setExpDesc('');
    setModalType(null);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-emerald-100">
                {t.brandName} • {t.softwareBrand}
              </span>
              <span className="text-xs text-emerald-200">
                {formatDate(new Date())}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              {shop?.shopName || 'मोती सुपर किराणा स्टोअर्स'}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {t.brandTagline}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/billing"
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition active:scale-95 whitespace-nowrap"
            >
              <Receipt className="w-4 h-4 text-emerald-700" />
              <span>{t.actionNewSale} (POS)</span>
            </Link>
            <button
              onClick={() => setModalType('udhar')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white rounded-xl font-semibold text-xs transition active:scale-95 whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.actionAddUdhar}</span>
            </button>
            <button
              onClick={() => setModalType('customer')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white rounded-xl font-semibold text-xs transition active:scale-95 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.actionAddCustomer}</span>
            </button>
            <button
              onClick={() => setModalType('expense')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white rounded-xl font-semibold text-xs transition active:scale-95 whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{t.actionAddExpense}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">{t.todaySales}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
              {formatCurrency(todaySalesTotal)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {todaySalesList.length} {language === 'mr' ? 'पावत्या' : 'bills'}
            </p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">{t.todayExpenses}</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl group-hover:scale-105 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
              {formatCurrency(todayExpensesTotal)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {todayExpensesList.length} {language === 'mr' ? 'खर्च नोंद' : 'entries'}
            </p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">{t.todayEstimatedProfit}</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:scale-105 transition">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-teal-700 tabular-nums">
              {formatCurrency(todayEstimatedProfit)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={t.profitDisclaimer}>
              {t.profitDisclaimer}
            </p>
          </div>
        </div>

        {/* Total Pending Udhar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">{t.totalPendingUdhar}</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-700 tabular-nums">
              {formatCurrency(totalPendingUdhar)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {customers.filter(c => c.currentBalance > 0).length} {language === 'mr' ? 'ग्राहकांकडे बाकी' : 'debtors'}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link 
          to="/customers"
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 hover:bg-slate-50 transition"
        >
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t.totalCustomers}</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{customers.length}</p>
          </div>
        </Link>

        <Link 
          to="/products"
          className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3 hover:bg-slate-50 transition"
        >
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t.totalProducts}</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{products.length}</p>
          </div>
        </Link>

        <Link 
          to="/products"
          className={`col-span-2 sm:col-span-1 p-4 rounded-xl border flex items-center gap-3 transition ${
            lowStockProducts.length > 0 
              ? 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${lowStockProducts.length > 0 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold">{t.lowStockItems}</p>
            <p className="text-lg font-bold tabular-nums">
              {lowStockProducts.length} {language === 'mr' ? 'वस्तू' : 'items'}
            </p>
          </div>
        </Link>
      </div>

      {/* Sales Trend Chart & Low Stock Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Trend (Last 7 Days) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.salesTrend}</h3>
              <p className="text-xs text-slate-500">दैनिक विक्री तुलना (मागील ७ दिवस)</p>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              {t.navReports} &rarr;
            </Link>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {last7Days.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round((item.daySales / maxDaySales) * 100));
              const isToday = item.dayStr === todayStr;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-slate-700 tabular-nums">
                    ₹{item.daySales}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                      isToday 
                        ? 'bg-emerald-600 group-hover:bg-emerald-700' 
                        : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                  />
                  <div className="text-center">
                    <p className={`text-[11px] font-semibold ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                      {item.dayName}
                    </p>
                    <p className="text-[9px] text-slate-400 tabular-nums">{item.dateNum}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">{t.lowStockItems}</h3>
            </div>
            <Link to="/products" className="text-xs font-semibold text-emerald-700">
              सर्व पहा
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-56">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                कोणत्याही वस्तूचा साठा कमी नाही. सर्व सुरक्षित आहे.
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map(prod => (
                <div key={prod.$id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-500">{prod.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded font-bold text-rose-700 bg-rose-50 border border-rose-200 tabular-nums">
                      {prod.stock} {prod.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Recent Payments Dual Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">{t.recentTransactions}</h3>
            <Link to="/reports" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              {t.navReports} &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t.noRecentTransactions}
              </div>
            ) : (
              sales.slice(0, 5).map(sale => (
                <div 
                  key={sale.$id}
                  onClick={() => setSelectedSale(sale)}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{sale.customerName || 'रोख गिऱ्हाईक'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {sale.invoiceNumber} • {formatDateTime(sale.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      sale.paymentStatus === 'paid' 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : 'text-amber-700 bg-amber-50'
                    }`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments (Jama) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">{t.recentPayments}</h3>
            <Link to="/udhar" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              {t.navUdhar} &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                कोणतीही जमा नोंद आढळली नाही.
              </div>
            ) : (
              payments.slice(0, 5).map(pay => (
                <div key={pay.$id} className="py-3 flex items-center justify-between text-xs px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{pay.customerName || 'ग्राहक'}</p>
                      <p className="text-[11px] text-slate-500">
                        {pay.paymentMethod.toUpperCase()} • {formatDateTime(pay.paymentDate || pay.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-emerald-800 tabular-nums">
                      + {formatCurrency(pay.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400">जमा झाले</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        shop={shop}
      />

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={modalType === 'customer'}
        onClose={() => setModalType(null)}
        title={t.actionAddCustomer}
        subtitle="नवीन ग्राहकाचे नाव व मोबाईल नंबर नोंदवा"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerName} *</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="उदा. राहुल जाधव"
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
              placeholder="पत्ता किंवा गल्ली क्रमांक"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
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

      {/* Quick Add Product Modal */}
      <Modal
        isOpen={modalType === 'product'}
        onClose={() => setModalType(null)}
        title={t.actionAddProduct}
        subtitle="नवीन वस्तू, विक्री दर व साठा जोडा"
      >
        <form onSubmit={handleAddProduct} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.productName} *</label>
            <input
              type="text"
              required
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="उदा. सुप्रिया सूर्यफूल तेल १ लिटर"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.productSKU}</label>
              <input
                type="text"
                value={newProdSKU}
                onChange={(e) => setNewProdSKU(e.target.value)}
                placeholder="SKU किंवा बारकोड"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.unit}</label>
              <select
                value={newProdUnit}
                onChange={(e) => setNewProdUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="piece">नग (Piece)</option>
                <option value="packet">पाकीट (Packet)</option>
                <option value="kg">किलो (Kg)</option>
                <option value="gram">ग्रॅम (Gram)</option>
                <option value="litre">लिटर (Litre)</option>
                <option value="ml">मिली (Ml)</option>
                <option value="box">बॉक्स (Box)</option>
                <option value="dozen">डझन (Dozen)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.purchasePrice}</label>
              <input
                type="number"
                step="any"
                value={newProdBuy}
                onChange={(e) => setNewProdBuy(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.sellingPrice} *</label>
              <input
                type="number"
                step="any"
                required
                value={newProdSell}
                onChange={(e) => setNewProdSell(e.target.value)}
                placeholder="120"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.availableStock}</label>
              <input
                type="number"
                step="any"
                value={newProdStock}
                onChange={(e) => setNewProdStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
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

      {/* Quick Add Udhar Modal */}
      <Modal
        isOpen={modalType === 'udhar'}
        onClose={() => setModalType(null)}
        title={t.addUdharTitle}
        subtitle="ग्राहकाच्या खात्यावर थेट उधार रक्कम नोंदवा"
      >
        <form onSubmit={handleAddUdhar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ग्राहक निवडा *</label>
            <select
              required
              value={udharCustId}
              onChange={(e) => setUdharCustId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- ग्राहक निवडा --</option>
              {customers.map(c => (
                <option key={c.$id} value={c.$id}>
                  {c.name} ({c.mobile}) - शिल्लक: ₹{c.currentBalance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.udharAmountLabel} *</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={udharAmount}
              onChange={(e) => setUdharAmount(e.target.value)}
              placeholder="₹ रक्कम टाका"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-amber-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">नोंद / कारण</label>
            <input
              type="text"
              value={udharNotes}
              onChange={(e) => setUdharNotes(e.target.value)}
              placeholder="उदा. किराणा सामान, दूध, भाजीपाला"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
            >
              {t.actionAddUdhar}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Expense Modal */}
      <Modal
        isOpen={modalType === 'expense'}
        onClose={() => setModalType(null)}
        title={t.actionAddExpense}
        subtitle="दुकान खर्च नोंदवा"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseCategory} *</label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="tea_snacks">{t.exp_tea_snacks}</option>
              <option value="electricity">{t.exp_electricity}</option>
              <option value="rent">{t.exp_rent}</option>
              <option value="transport">{t.exp_transport}</option>
              <option value="salary">{t.exp_salary}</option>
              <option value="maintenance">{t.exp_maintenance}</option>
              <option value="purchase">{t.exp_purchase}</option>
              <option value="other">{t.exp_other}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseAmount} *</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="₹ रक्कम"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-rose-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseDescription}</label>
            <input
              type="text"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="उदा. चहा-नाश्ता, टेम्पो भाडे"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              {t.actionSave}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
