import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  TrendingDown, 
  IndianRupee,
  Coffee,
  Lightbulb,
  Building,
  Truck,
  Users,
  Wrench,
  ShoppingBag,
  MoreHorizontal
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getExpenses, createExpense, deleteExpense } from '../services/storage';
import { Expense, ExpenseCategory } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Expenses: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('tea_snacks');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getExpenses(shopId);
      setExpenses(data);
    } catch (e) {
      console.error('Error loading expenses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const todayExpenses = expenses.filter(e => e.expenseDate.slice(0, 10) === todayStr || e.createdAt.slice(0, 10) === todayStr);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlyExpenses = expenses.filter(e => e.expenseDate.slice(0, 7) === currentMonthStr || e.createdAt.slice(0, 7) === currentMonthStr);
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || e.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await createExpense({
      shopId,
      category,
      amount: parseFloat(amount) || 0,
      description: description || 'दुकान खर्च',
      expenseDate: new Date(expenseDate).toISOString(),
    });

    setIsAddOpen(false);
    setAmount('');
    setDescription('');
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteExpense(deleteId);
    setDeleteId(null);
    loadData();
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'rent': return Building;
      case 'electricity': return Lightbulb;
      case 'transport': return Truck;
      case 'salary': return Users;
      case 'purchase': return ShoppingBag;
      case 'maintenance': return Wrench;
      case 'tea_snacks': return Coffee;
      default: return MoreHorizontal;
    }
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'rent': return t.exp_rent;
      case 'electricity': return t.exp_electricity;
      case 'transport': return t.exp_transport;
      case 'salary': return t.exp_salary;
      case 'purchase': return t.exp_purchase;
      case 'maintenance': return t.exp_maintenance;
      case 'tea_snacks': return t.exp_tea_snacks;
      default: return t.exp_other;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-700" />
            <span>{t.expensesTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            भाडे, लाईट बिल, चहा-नाश्ता व इतर दैनंदिन खर्चाची अचूक नोंद.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddExpense}</span>
        </button>
      </div>

      {/* KPI Cards: Daily & Monthly Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-bold text-rose-800 block">{t.dailyExpenseTotal}</span>
          <p className="text-2xl font-black text-rose-950 mt-1 tabular-nums">
            {formatCurrency(todayTotal)}
          </p>
          <p className="text-[11px] text-rose-700 mt-0.5">
            आज एकूण {todayExpenses.length} खर्च नोंदी
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-600 block">{t.monthlyExpenseTotal}</span>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {formatCurrency(monthlyTotal)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            चालू महिन्यातील एकूण दुकान खर्च
          </p>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="space-y-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खर्चाचा तपशील शोधा..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'tea_snacks', 'electricity', 'rent', 'transport', 'salary', 'purchase', 'other'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'सर्व खर्च (All)' : getCategoryLabel(cat as ExpenseCategory)}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            कोणताही खर्च आढळला नाही.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map(exp => {
              const Icon = getCategoryIcon(exp.category);

              return (
                <div key={exp.$id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {exp.description}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {getCategoryLabel(exp.category)} • {formatDate(exp.expenseDate || exp.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm sm:text-base font-black text-rose-700 tabular-nums">
                      - {formatCurrency(exp.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => setDeleteId(exp.$id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition"
                      title={t.actionDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t.actionAddExpense}
        subtitle="दुकान खर्चाची रक्कम व प्रकार नोंदवा"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseCategory} *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₹ रक्कम"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-rose-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseDescription}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="उदा. चहा-नाश्ता, किराणा वाहतूक टेम्पो"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.expenseDate}</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              खर्च जतन करा (Save)
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t.actionDelete}
        message="तुम्हाला खात्री आहे की तुम्ही ही खर्च नोंद हटवू इच्छिता?"
      />
    </div>
  );
};
