import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  Phone, 
  ChevronRight, 
  Share2, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getCustomers, 
  getPayments, 
  recordPayment, 
  addUdharEntry 
} from '../services/storage';
import { Customer, Payment } from '../types';
import { Modal } from '../components/common/Modal';

export const UdharKhata: React.FC = () => {
  const { t, formatCurrency, formatDateTime } = useLanguage();
  const { shop } = useAuth();
  const navigate = useNavigate();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: 'pending' (default - who owes money), 'all', 'paid'
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment (Jama) Modal
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payNotes, setPayNotes] = useState('');

  // Add Udhar Modal
  const [isAddUdharOpen, setIsAddUdharOpen] = useState(false);
  const [udharCustId, setUdharCustId] = useState('');
  const [udharAmount, setUdharAmount] = useState('');
  const [udharNotes, setUdharNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [custData, payData] = await Promise.all([
        getCustomers(shopId),
        getPayments(shopId),
      ]);
      setCustomers(custData);
      setPayments(payData);
    } catch (e) {
      console.error('Failed to load udhar data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Total Outstanding across all customers
  const totalPendingUdhar = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalUdharGiven = customers.reduce((sum, c) => sum + (c.totalUdhar || 0), 0);
  const totalPaymentsReceived = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.mobile.includes(q);
    if (!matchesSearch) return false;

    if (filterStatus === 'pending') {
      return c.currentBalance > 0;
    } else if (filterStatus === 'paid') {
      return c.currentBalance === 0 && c.totalPaid > 0;
    }
    return true; // 'all'
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || !payAmount) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    await recordPayment({
      shopId,
      customerId: selectedCust.$id,
      customerName: selectedCust.name,
      amount: amt,
      paymentMethod: payMode,
      paymentDate: new Date().toISOString(),
      notes: payNotes || 'जमा पावती',
    });

    setSelectedCust(null);
    setPayAmount('');
    setPayNotes('');
    loadData();
  };

  const handleAddUdhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udharCustId || !udharAmount) return;

    const amt = parseFloat(udharAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('कृपया वैध उधार रक्कम प्रविष्ट करा.');
      return;
    }

    await addUdharEntry(shopId, udharCustId, amt, udharNotes);
    setIsAddUdharOpen(false);
    setUdharCustId('');
    setUdharAmount('');
    setUdharNotes('');
    loadData();
  };

  const sendWhatsAppReminder = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!c.mobile || c.currentBalance <= 0) return;
    const msg = t.whatsappReminder
      .replace('{customer}', c.name)
      .replace('{shop}', shop?.shopName || 'MOTi Dukaan')
      .replace('{amount}', c.currentBalance.toString());
    window.open(`https://wa.me/91${c.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <span>{t.navUdhar} (उधार खातेवही)</span>
          </h2>
          <p className="text-xs text-slate-500">
            प्रत्येक ग्राहकाचा उधार हिशोब, जमा रकमा व शिल्लक बाकी.
          </p>
        </div>

        <button
          onClick={() => setIsAddUdharOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddUdhar}</span>
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-bold text-amber-900 block">{t.totalPendingUdhar}</span>
          <p className="text-2xl font-black text-amber-950 mt-1 tabular-nums">
            {formatCurrency(totalPendingUdhar)}
          </p>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {customers.filter(c => c.currentBalance > 0).length} ग्राहकांकडे येणे बाकी आहे
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-600 block">{t.totalUdharGiven}</span>
          <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {formatCurrency(totalUdharGiven)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            आजवर दिलेली एकूण उधार रक्कम
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-300/80 rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-bold text-emerald-900 block">{t.totalPaymentsReceived}</span>
          <p className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">
            {formatCurrency(totalPaymentsReceived)}
          </p>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            आजवर ग्राहकांकडून जमा झालेली एकूण रक्कम
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ग्राहकाचे नाव किंवा मोबाईल नंबर शोधा..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs font-medium"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            बाकी येणे ({customers.filter(c => c.currentBalance > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            सर्व ग्राहक ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'paid'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            पूर्ण भरलेले
          </button>
        </div>
      </div>

      {/* Customer Udhar List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            कोणतीही उधार नोंद आढळली नाही.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map(customer => {
              const isPending = customer.currentBalance > 0;

              return (
                <div
                  key={customer.$id}
                  onClick={() => navigate(`/customers/${customer.$id}`)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition"
                >
                  {/* Left: Customer Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border ${
                      isPending ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {customer.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isPending ? t.statusPending : t.statusPaid}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {customer.mobile}
                      </p>
                    </div>
                  </div>

                  {/* Middle / Right: Balances & Quick Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">
                        {t.remainingBalance}
                      </span>
                      <span className={`text-base sm:text-lg font-black tabular-nums ${isPending ? 'text-amber-800' : 'text-slate-700'}`}>
                        {formatCurrency(customer.currentBalance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Record Payment Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCust(customer);
                          setPayAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1" />
                        <span>जमा करा</span>
                      </button>

                      {/* WhatsApp Reminder Button */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={(e) => sendWhatsAppReminder(customer, e)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title={t.actionSendWhatsApp}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Payment (Jama) Modal */}
      <Modal
        isOpen={!!selectedCust}
        onClose={() => setSelectedCust(null)}
        title={`${t.actionRecordPayment} - ${selectedCust?.name}`}
        subtitle={`सध्याची येणे बाकी: ${formatCurrency(selectedCust?.currentBalance || 0)}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentAmount} *</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="₹ जमा रक्कम"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.paymentMode}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMode('cash')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  payMode === 'cash' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                रोख (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPayMode('upi')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  payMode === 'upi' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                UPI (GPay/PhonePe)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">नोंद / संदर्भ</label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="उदा. गुगल पे द्वारे भरणा"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedCust(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              पैसे जमा करा (Save)
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Direct Udhar Modal */}
      <Modal
        isOpen={isAddUdharOpen}
        onClose={() => setIsAddUdharOpen(false)}
        title={t.addUdharTitle}
        subtitle="ग्राहकाच्या खात्यावर नवीन उधार रक्कम नोंदवा"
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
              placeholder="₹ उधार रक्कम टाका"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-amber-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">तपशील / कारण</label>
            <input
              type="text"
              value={udharNotes}
              onChange={(e) => setUdharNotes(e.target.value)}
              placeholder="उदा. किराणा सामान, दूध, डाळी"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddUdharOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
            >
              उधार नोंदवा (Save)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
