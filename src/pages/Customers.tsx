import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  BookOpen, 
  ArrowDownLeft,
  Share2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  recordPayment,
  addUdharEntry
} from '../services/storage';
import { Customer } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Customers: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { shop } = useAuth();
  const navigate = useNavigate();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Recording Modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [payNotes, setPayNotes] = useState('');

  // Add Udhar Modal
  const [udharCustomer, setUdharCustomer] = useState<Customer | null>(null);
  const [udharAmount, setUdharAmount] = useState('');
  const [udharNotes, setUdharNotes] = useState('');

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCustomers(shopId);
      setCustomers(data);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.mobile.includes(q);
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setMobile('');
    setAddress('');
    setNotes('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(c);
    setName(c.name);
    setMobile(c.mobile);
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsAddEditOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;

    if (editingCustomer) {
      await updateCustomer({
        ...editingCustomer,
        name,
        mobile,
        address,
        notes,
      });
    } else {
      await createCustomer({
        shopId,
        name,
        mobile,
        address,
        notes,
      });
    }

    setIsAddEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCustomer(deleteId);
    setDeleteId(null);
    loadData();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || !payAmount) return;

    await recordPayment({
      shopId,
      customerId: paymentCustomer.$id,
      customerName: paymentCustomer.name,
      amount: parseFloat(payAmount) || 0,
      paymentMethod: payMode,
      paymentDate: new Date().toISOString(),
      notes: payNotes || 'जमा रक्कम',
    });

    setPaymentCustomer(null);
    setPayAmount('');
    setPayNotes('');
    loadData();
  };

  const handleAddUdhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udharCustomer || !udharAmount) return;

    await addUdharEntry(shopId, udharCustomer.$id, parseFloat(udharAmount) || 0, udharNotes);
    setUdharCustomer(null);
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
            <Users className="w-5 h-5 text-emerald-700" />
            <span>{t.customersTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            एकूण ग्राहक: <span className="font-bold text-slate-800 tabular-nums">{customers.length}</span> • एकूण येणे उधार: <span className="font-extrabold text-amber-700 tabular-nums">{formatCurrency(totalOutstanding)}</span>
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddCustomer}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
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

      {/* Customer Cards & Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            कोणताही ग्राहक आढळला नाही.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map(customer => (
              <div
                key={customer.$id}
                onClick={() => navigate(`/customers/${customer.$id}`)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {customer.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customer.mobile}
                      </span>
                      {customer.address && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-[11px] truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {customer.address}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Balances & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">
                      {t.remainingBalance}
                    </span>
                    <span className={`text-base font-extrabold tabular-nums ${customer.currentBalance > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                      {formatCurrency(customer.currentBalance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Record Payment Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPaymentCustomer(customer);
                        setPayAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition"
                      title={t.actionRecordPayment}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1" />
                      <span>जमा</span>
                    </button>

                    {/* Add Udhar Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUdharCustomer(customer);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition"
                      title={t.actionAddUdhar}
                    >
                      <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                      <span>उधार</span>
                    </button>

                    {/* WhatsApp reminder if pending */}
                    {customer.currentBalance > 0 && (
                      <button
                        type="button"
                        onClick={(e) => sendWhatsAppReminder(customer, e)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title={t.actionSendWhatsApp}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(customer, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                      title={t.actionEdit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(customer.$id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title={t.actionDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingCustomer ? 'ग्राहक माहिती बदला' : t.actionAddCustomer}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. सागर गायकवाड"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerMobile} *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerAddress}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="पत्ता किंवा कॉलनी"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.customerNotes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="काही विशेष टीप"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
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

      {/* Record Payment (Jama) Modal */}
      <Modal
        isOpen={!!paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        title={`${t.actionRecordPayment} - ${paymentCustomer?.name}`}
        subtitle={`सध्याची शिल्लक उधार: ${formatCurrency(paymentCustomer?.currentBalance || 0)}`}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">नोंद / पावती संदर्भ</label>
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
              onClick={() => setPaymentCustomer(null)}
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
        isOpen={!!udharCustomer}
        onClose={() => setUdharCustomer(null)}
        title={`${t.addUdharTitle} - ${udharCustomer?.name}`}
        subtitle={`सध्याची शिल्लक उधार: ${formatCurrency(udharCustomer?.currentBalance || 0)}`}
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
              placeholder="उदा. किराणा माल, तेल, डाळी"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUdharCustomer(null)}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t.actionDelete}
        message="तुम्हाला खात्री आहे की तुम्ही या ग्राहकाचे रेकॉर्ड हटवू इच्छिता? ही कृती पूर्ववत करता येणार नाही."
      />
    </div>
  );
};
