import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  BookOpen,
  Package,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getSales, 
  getExpenses, 
  getCustomers, 
  getProducts, 
  getPayments 
} from '../services/storage';
import { Sale, Expense, Customer, Product, Payment } from '../types';

export const Reports: React.FC = () => {
  const { t, formatCurrency, formatDate, formatDateTime, language } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Report Tab: 'sales' | 'expenses' | 'profit' | 'udhar' | 'stock'
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'profit' | 'udhar' | 'stock'>('sales');

  // Date Range Filter (Default: Last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, e, c, p, pay] = await Promise.all([
        getSales(shopId),
        getExpenses(shopId),
        getCustomers(shopId),
        getProducts(shopId),
        getPayments(shopId),
      ]);
      setSales(s);
      setExpenses(e);
      setCustomers(c);
      setProducts(p);
      setPayments(pay);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Filter records by date range
  const filteredSales = sales.filter(s => {
    const date = s.createdAt.slice(0, 10);
    return date >= startDate && date <= endDate;
  });

  const filteredExpenses = expenses.filter(e => {
    const date = (e.expenseDate || e.createdAt).slice(0, 10);
    return date >= startDate && date <= endDate;
  });

  // Financial aggregates
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSalesPaid = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalSalesDue = filteredSales.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalExpensesCost = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Estimated gross profit calculation
  let totalGrossProfit = 0;
  for (const s of filteredSales) {
    for (const item of s.items) {
      const margin = (item.unitPrice - (item.purchasePriceSnapshot || 0)) * item.quantity;
      totalGrossProfit += Math.max(0, margin);
    }
    totalGrossProfit -= s.discount || 0;
  }
  const netEstimatedProfit = totalGrossProfit - totalExpensesCost;

  const totalPendingUdhar = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalInventoryStockValue = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);

  // CSV Export Generator
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM for Marathi text

    if (reportType === 'sales') {
      csvContent += 'पावती क्र,तारीख,ग्राहक,पद्धत,उप-एकूण,सवलत,एकूण देय,भरलेली रक्कम,उधार बाकी\n';
      filteredSales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${formatDate(s.createdAt)}","${s.customerName || 'रोख'}","${s.paymentMethod}",${s.subtotal},${s.discount},${s.totalAmount},${s.paidAmount},${s.dueAmount}\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent += 'तारीख,प्रकार,तपशील,रक्कम (₹)\n';
      filteredExpenses.forEach(e => {
        csvContent += `"${formatDate(e.expenseDate || e.createdAt)}","${e.category}","${e.description}",${e.amount}\n`;
      });
    } else if (reportType === 'udhar') {
      csvContent += 'ग्राहक नाव,मोबाईल,पत्ता,एकूण खरेदी,एकूण उधार,एकूण जमा,शिल्लक बाकी (₹)\n';
      customers.forEach(c => {
        csvContent += `"${c.name}","${c.mobile}","${c.address || ''}",${c.totalPurchases},${c.totalUdhar},${c.totalPaid},${c.currentBalance}\n`;
      });
    } else if (reportType === 'stock') {
      csvContent += 'वस्तूचे नाव,SKU,प्रवर्ग,खरेदी दर,विक्री दर,उपलब्ध साठा,एकक,एकूण मूल्य (₹)\n';
      products.forEach(p => {
        csvContent += `"${p.name}","${p.sku}","${p.category}",${p.purchasePrice},${p.sellingPrice},${p.stock},"${p.unit}",${p.stock * p.sellingPrice}\n`;
      });
    } else {
      csvContent += 'मेट्रिक,मूल्य (₹)\n';
      csvContent += `"एकूण विक्री",${totalSalesRevenue}\n`;
      csvContent += `"एकूण खर्च",${totalExpensesCost}\n`;
      csvContent += `"अंदाजित नफा",${netEstimatedProfit}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MOTi_Dukaan_${reportType}_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            दैनिक, साप्ताहिक व मासिक विक्री, खर्च आणि नफा अहवाल.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-semibold text-xs transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>{t.actionExportCSV}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.actionPrint}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector & Report Type Tabs */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          {[
            { id: 'sales', label: t.reportDailySales },
            { id: 'profit', label: t.reportProfitEstimate },
            { id: 'expenses', label: t.reportExpenses },
            { id: 'udhar', label: t.reportUdhar },
            { id: 'stock', label: t.reportStock },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === tab.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date pickers */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">{t.startDate}:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">{t.endDate}:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
            />
          </div>

          <span className="text-[11px] text-slate-400">
            ({formatDate(startDate)} ते {formatDate(endDate)})
          </span>
        </div>
      </div>

      {/* Printable Report Document */}
      <div id="printable-report" className="space-y-5">
        {/* Print Header */}
        <div className="hidden print:block text-center pb-4 border-b border-slate-300">
          <h2 className="text-xl font-bold text-slate-900">{shop?.shopName}</h2>
          <p className="text-xs text-slate-600">{shop?.address} • मोबाईल: {shop?.mobile}</p>
          <p className="text-sm font-bold text-slate-800 mt-2">
            {reportType.toUpperCase()} अहवाल ({formatDate(startDate)} ते {formatDate(endDate)})
          </p>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">निवडलेल्या काळातील विक्री</span>
            <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {formatCurrency(totalSalesRevenue)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              एकूण {filteredSales.length} पावत्या
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">निवडलेल्या काळातील खर्च</span>
            <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
              {formatCurrency(totalExpensesCost)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              एकूण {filteredExpenses.length} खर्च नोंदी
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-300/80 p-4 sm:p-5 rounded-2xl">
            <span className="text-xs font-bold text-emerald-900">निवडलेल्या काळातील अंदाजित नफा</span>
            <p className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">
              {formatCurrency(netEstimatedProfit)}
            </p>
            <p className="text-[10px] text-emerald-800 mt-0.5">
              {t.profitDisclaimer}
            </p>
          </div>
        </div>

        {/* REPORT CONTENT VIEW */}

        {/* 1. SALES REPORT */}
        {reportType === 'sales' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                विक्री तपशील ({filteredSales.length} पावत्या)
              </h3>
              <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                एकूण: {formatCurrency(totalSalesRevenue)}
              </span>
            </div>

            {filteredSales.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                या कालावधीत कोणतीही विक्री नोंद आढळली नाही.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                      <th className="py-2.5 px-4">पावती क्र</th>
                      <th className="py-2.5 px-3">दिनांक</th>
                      <th className="py-2.5 px-3">ग्राहक</th>
                      <th className="py-2.5 px-3">पद्धत</th>
                      <th className="py-2.5 px-3 text-right">सवलत</th>
                      <th className="py-2.5 px-3 text-right">भरलेली रक्कम</th>
                      <th className="py-2.5 px-4 text-right">एकूण बिल (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map(s => (
                      <tr key={s.$id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{s.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">{formatDate(s.createdAt)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.customerName || 'रोख'}</td>
                        <td className="py-2.5 px-3 uppercase text-[11px] font-semibold text-slate-500">{s.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 tabular-nums">₹{s.discount}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">{formatCurrency(s.paidAmount)}</td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-900 tabular-nums">{formatCurrency(s.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. PROFIT ESTIMATE REPORT */}
        {reportType === 'profit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                अंदाजित नफा-तोटा विश्लेषण (Profit Estimate Statement)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(startDate)} ते {formatDate(endDate)} दरम्यानचे उत्पन्न व खर्च
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">एकूण विक्री महसूल (Total Sales Revenue):</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(totalSalesRevenue)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-teal-800">
                <span className="font-semibold">वस्तू विक्रीतून झालेला ढोबळ नफा (Gross Product Margin):</span>
                <span className="font-bold tabular-nums">+ {formatCurrency(totalGrossProfit)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-700">
                <span className="font-semibold">नोंदवलेला दुकान खर्च (Recorded Shop Expenses):</span>
                <span className="font-bold tabular-nums">- {formatCurrency(totalExpensesCost)}</span>
              </div>

              <div className="flex justify-between py-3 border-t-2 border-slate-300 text-sm font-black">
                <span className="text-slate-900">निव्वळ अंदाजित नफा (Net Estimated Profit):</span>
                <span className="text-emerald-800 tabular-nums text-lg">
                  {formatCurrency(netEstimatedProfit)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>*महत्त्वाची नोंद:</strong> हा नफा नोंदीत खरेदी दर, विक्री दर व नोंदवलेल्या खर्चावर आधारित अंदाजित नफा आहे. यामध्ये दुकानदाराने नोंद न केलेले इतर व्यावसायिक खर्च, कर अथवा घसारा समाविष्ट नसून हा अधिकृत सीए ऑडिट नफा नाही.
            </div>
          </div>
        )}

        {/* 3. EXPENSES REPORT */}
        {reportType === 'expenses' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                खर्च तपशील ({filteredExpenses.length} नोंदी)
              </h3>
              <span className="text-xs font-extrabold text-rose-700 tabular-nums">
                एकूण: {formatCurrency(totalExpensesCost)}
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                या कालावधीत कोणतीही खर्च नोंद आढळली नाही.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                      <th className="py-2.5 px-4">दिनांक</th>
                      <th className="py-2.5 px-3">खर्च प्रकार</th>
                      <th className="py-2.5 px-3">तपशील</th>
                      <th className="py-2.5 px-4 text-right">रक्कम (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map(e => (
                      <tr key={e.$id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 text-slate-600">{formatDate(e.expenseDate || e.createdAt)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{e.category}</td>
                        <td className="py-2.5 px-3 text-slate-700">{e.description}</td>
                        <td className="py-2.5 px-4 text-right font-black text-rose-700 tabular-nums">
                          {formatCurrency(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. UDHAR REPORT */}
        {reportType === 'udhar' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ग्राहक उधार अहवाल
              </h3>
              <span className="text-xs font-extrabold text-amber-800 tabular-nums">
                एकूण येणे बाकी: {formatCurrency(totalPendingUdhar)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-4">ग्राहक नाव</th>
                    <th className="py-2.5 px-3">मोबाईल</th>
                    <th className="py-2.5 px-3 text-right">एकूण खरेदी</th>
                    <th className="py-2.5 px-3 text-right">एकूण उधार</th>
                    <th className="py-2.5 px-3 text-right">एकूण जमा</th>
                    <th className="py-2.5 px-4 text-right">शिल्लक बाकी (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(c => (
                    <tr key={c.$id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{c.mobile}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(c.totalPurchases)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-amber-700">{formatCurrency(c.totalUdhar)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700">{formatCurrency(c.totalPaid)}</td>
                      <td className="py-2.5 px-4 text-right font-black tabular-nums text-amber-900">
                        {formatCurrency(c.currentBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. STOCK REPORT */}
        {reportType === 'stock' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                साठा व इन्व्हेंटरी मूल्य अहवाल
              </h3>
              <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                एकूण विक्री मूल्य: {formatCurrency(totalInventoryStockValue)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-4">वस्तू</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">खरेदी दर</th>
                    <th className="py-2.5 px-3 text-right">विक्री दर</th>
                    <th className="py-2.5 px-3 text-center">साठा</th>
                    <th className="py-2.5 px-4 text-right">एकूण मूल्य (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.$id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{p.sku}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-emerald-800">{formatCurrency(p.sellingPrice)}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black tabular-nums text-slate-900">
                        {formatCurrency(p.stock * p.sellingPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
