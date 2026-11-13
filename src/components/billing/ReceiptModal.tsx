import React, { useState } from 'react';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { Sale, Shop } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  shop: Shop | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  shop,
}) => {
  const { t, formatCurrency, formatDateTime } = useLanguage();
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen || !sale || !shop) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!sale.customerMobile) {
      alert('ग्राहकाचा मोबाईल क्रमांक उपलब्ध नाही.');
      return;
    }
    const message = `*${shop.shopName}*\nपावती क्र: ${sale.invoiceNumber}\nतारीख: ${formatDateTime(sale.createdAt)}\nएकूण रक्कम: ${formatCurrency(sale.totalAmount)}\nदिलेली रक्कम: ${formatCurrency(sale.paidAmount)}\nबाकी: ${formatCurrency(sale.dueAmount)}\nधन्यवाद! पुन्हा भेट द्या.`;
    const url = `https://wa.me/91${sale.customerMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`px-3 py-1 rounded-md transition ${printFormat === 'thermal' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
            >
              थर्मल (58mm/80mm)
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1 rounded-md transition ${printFormat === 'a4' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
            >
              A4 बिल
            </button>
          </div>

          <div className="flex items-center gap-2">
            {sale.customerMobile && (
              <button
                onClick={handleWhatsAppShare}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                title="व्हॉट्सॲपवर पाठवा"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{t.actionPrint}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white p-6 shadow-sm border border-slate-200 text-slate-900 transition-all ${
              printFormat === 'thermal'
                ? 'w-full max-w-[320px] font-mono text-xs leading-tight'
                : 'w-full text-xs font-sans'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-900">
                {shop.shopName}
              </h2>
              {shop.tagline && (
                <p className="text-[11px] text-slate-600 mt-0.5">{shop.tagline}</p>
              )}
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{shop.address}</p>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">मोबाईल: {shop.mobile}</p>
              {shop.gstNumber && (
                <p className="text-[10px] text-slate-500">GST: {shop.gstNumber}</p>
              )}
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">पावती क्र:</span>
                <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">दिनांक व वेळ:</span>
                <span className="text-slate-800">{formatDateTime(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ग्राहक:</span>
                <span className="font-semibold text-slate-900">
                  {sale.customerName || 'रोख गिऱ्हाईक'}
                </span>
              </div>
              {sale.customerMobile && (
                <div className="flex justify-between">
                  <span className="text-slate-600">मोबाईल:</span>
                  <span className="text-slate-800">{sale.customerMobile}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="grid grid-cols-12 font-bold text-[11px] pb-1 border-b border-slate-300">
                <div className="col-span-6">वस्तू</div>
                <div className="col-span-2 text-right">नग</div>
                <div className="col-span-2 text-right">दर</div>
                <div className="col-span-2 text-right">एकूण</div>
              </div>

              <div className="divide-y divide-slate-100 py-1 space-y-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] py-0.5 items-center">
                    <div className="col-span-6 truncate font-medium text-slate-900">
                      {item.productNameSnapshot}
                    </div>
                    <div className="col-span-2 text-right text-slate-700 tabular-nums">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-slate-700 tabular-nums">
                      ₹{item.unitPrice}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-slate-900 tabular-nums">
                      ₹{item.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">उप-एकूण (Subtotal):</span>
                <span className="tabular-nums font-medium text-slate-900">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>सवलत (Discount):</span>
                  <span className="tabular-nums font-medium">- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-200">
                <span>एकूण देय रक्कम:</span>
                <span className="tabular-nums text-slate-950">{formatCurrency(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>भरलेली रक्कम ({sale.paymentMethod.toUpperCase()}):</span>
                <span className="tabular-nums font-bold text-emerald-800">{formatCurrency(sale.paidAmount)}</span>
              </div>
              {sale.dueAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>शिल्लक बाकी (उधार):</span>
                  <span className="tabular-nums">{formatCurrency(sale.dueAmount)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-4 space-y-1">
              <p className="text-xs font-bold text-slate-800">{t.receiptThankYou}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest pt-1">
                {t.poweredBy}
              </p>
              <p className="text-[9px] text-slate-400">MOTi Biz • MOTi Dukaan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
