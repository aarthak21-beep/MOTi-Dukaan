import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  BookOpen, 
  ArrowDownLeft, 
  Receipt, 
  Share2, 
  Plus, 
  Calendar,
  Clock,
  IndianRupee
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getCustomers, 
  getSales, 
  getPayments, 
  recordPayment, 
  addUdharEntry 
} from '../services/storage';
import { Customer, Sale, Payment } from '../types';
import { ReceiptModal } from '../components/billing/ReceiptModal';
import { Modal } from '../components/common/Modal';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, formatCurrency, formatDateTime, formatDate } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payNotes, setPayNotes] = useState('');

  const [isUdharOpen, setIsUdharOpen] = useState(false);
  const [udharAmount, setUdharAmount] = useState('');
  const [udharNotes, setUdharNotes] = useState('');

  // Selected receipt
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Tab: Transactions vs Payments
  const [activeTab, setActiveTab] = useState<'transactions' | 'payments'>('transactions');

  const loadCustomerData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [allCusts, allSales, allPayments] = await Promise.all([
        getCustomers(shopId),
        getSales(shopId),
        getPayments(shopId, id),
      ]);

      const matchedCust = allCusts.find(c => c.$id === id);
      setCustomer(matchedCust || null);

      const custSales = allSales.filter(s => s.customerId === id);
      setSales(custSales);
      setPayments(allPayments);
    } catch (e) {
      console.error('Error loading customer details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id, shopId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        {t.loading}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-600">
        <p className="text-sm font-semibold">ग्राहक आढळला नाही.</p>
        <Link to="/customers" className="mt-3 inline-block text-xs text-emerald-700 underline">
          &larr; ग्राहक यादीकडे परत जा
        </Link>
      </div>
    );
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount) return;

    await recordPayment({
      shopId,
      customerId: customer.$id,
      customerName: customer.name,
      amount: parseFloat(payAmount) || 0,
      paymentMethod: payMode,
      paymentDate: new Date().toISOString(),
      notes: payNotes || 'जमा रक्कम',
    });

    setIsPaymentOpen(false);
    setPayAmount('');
    setPayNotes('');
    loadCustomerData();
  };

  const handleAddUdhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udharAmount) return;

    await addUdharEntry(shopId, customer.$id, parseFloat(udharAmount) || 0, udharNotes);
    setIsUdharOpen(false);
    setUdharAmount('');
    setUdharNotes('');
    loadCustomerData();
  };

  const sendWhatsAppReminder = () => {
    if (!customer.mobile || customer.currentBalance <= 0) return;
    const msg = t.whatsappReminder
      .replace('{customer}', customer.name)
      .replace('{shop}', shop?.shopName || 'MOTi Dukaan')
      .replace('{amount}', customer.currentBalance.toString());
    window.open(`https://wa.me/91${customer.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 lg:pb-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.customersTitle}</span>
        </button>
      </div>

      {/* Customer Profile Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {customer.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <a 
                  href={`tel:${customer.mobile}`}
                  className="flex items-center gap-1 font-mono text-emerald-700 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {customer.mobile}
                </a>
                {customer.address && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {customer.address}
                    </span>
                  </>
                )}
              </div>
              {customer.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {customer.notes}
                </p>
              )}
            </div>
          </div>

          {/* Quick Balance & Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {customer.currentBalance > 0 && (
              <button
                type="button"
                onClick={sendWhatsAppReminder}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>{t.actionSendWhatsApp}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setPayAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
                setIsPaymentOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>पैसे जमा करा</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUdharOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>उधार नोंदवा</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              {t.totalPurchases}
            </span>
            <span className="text-base font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(customer.totalPurchases)}
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">
              {t.totalUdharGiven}
            </span>
            <span className="text-base font-extrabold text-amber-800 tabular-nums">
              {formatCurrency(customer.totalUdhar)}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              {t.totalPaymentsReceived}
            </span>
            <span className="text-base font-extrabold text-emerald-800 tabular-nums">
              {formatCurrency(customer.totalPaid)}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${customer.currentBalance > 0 ? 'bg-amber-100/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-extrabold text-slate-700 block">
              {t.remainingBalance}
            </span>
            <span className={`text-lg font-black tabular-nums ${customer.currentBalance > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
              {formatCurrency(customer.currentBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Transactions vs Payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 text-center ${
              activeTab === 'transactions'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            खरेदी व उधार व्यवहार ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-3 px-4 text-xs font-bold transition border-b-2 text-center ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            जमा पावत्या / Payments ({payments.length})
          </button>
        </div>

        {activeTab === 'transactions' ? (
          <div className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                या ग्राहकाचा कोणताही व्यवहार आढळला नाही.
              </div>
            ) : (
              sales.map(sale => (
                <div
                  key={sale.$id}
                  onClick={() => setSelectedSale(sale)}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs font-mono">{sale.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-500">{formatDateTime(sale.createdAt)}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {sale.items.map(i => `${i.productNameSnapshot} (${i.quantity} ${i.unit})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                    {sale.dueAmount > 0 ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        उधार: {formatCurrency(sale.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        पूर्ण भरले
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                कोणतीही जमा पावती आढळली नाही.
              </div>
            ) : (
              payments.map(pay => (
                <div key={pay.$id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {pay.paymentMethod.toUpperCase()} द्वारे जमा
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(pay.paymentDate || pay.createdAt)}
                      </p>
                      {pay.notes && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{pay.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-emerald-800 tabular-nums">
                      + {formatCurrency(pay.amount)}
                    </p>
                    <span className="text-[10px] text-slate-400">खात्यात जमा</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        shop={shop}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={`${t.actionRecordPayment} - ${customer.name}`}
        subtitle={`सध्याची शिल्लक उधार: ${formatCurrency(customer.currentBalance)}`}
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
              placeholder="₹ जमा केलेली रक्कम"
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
              placeholder="उदा. रोख भरणा"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
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
        isOpen={isUdharOpen}
        onClose={() => setIsUdharOpen(false)}
        title={`${t.addUdharTitle} - ${customer.name}`}
        subtitle={`सध्याची शिल्लक उधार: ${formatCurrency(customer.currentBalance)}`}
      >
        <form onSubmit={handleAddUdhar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.udharAmountLabel} *</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={udharAmount}
              onChange={(e) => setUdharAmount(e.target.value)}
              placeholder="₹ उधार रक्कम"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-extrabold text-amber-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">सामान तपशील / कारण</label>
            <input
              type="text"
              value={udharNotes}
              onChange={(e) => setUdharNotes(e.target.value)}
              placeholder="उदा. किराणा सामान"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUdharOpen(false)}
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
