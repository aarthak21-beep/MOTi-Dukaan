import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getStockMovements, 
  getProducts, 
  adjustStock 
} from '../services/storage';
import { StockMovement, Product } from '../types';
import { Modal } from '../components/common/Modal';

export const StockMovements: React.FC = () => {
  const { t, formatDateTime } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Quick Purchase / Add Stock Modal
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [stockInProdId, setStockInProdId] = useState('');
  const [stockInQty, setStockInQty] = useState('');
  const [stockInNotes, setStockInNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [moves, prods] = await Promise.all([
        getStockMovements(shopId),
        getProducts(shopId),
      ]);
      setMovements(moves);
      setProducts(prods);
    } catch (e) {
      console.error('Error loading stock movements', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const filteredMovements = movements.filter(m => {
    const matchesProd = selectedProductId === 'all' || m.productId === selectedProductId;
    const matchesType = filterType === 'all' || m.movementType === filterType;
    return matchesProd && matchesType;
  });

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInProdId || !stockInQty) return;

    const prod = products.find(p => p.$id === stockInProdId);
    if (!prod) return;

    const addQty = parseFloat(stockInQty);
    if (isNaN(addQty) || addQty <= 0) {
      alert('कृपया वैध संख्या प्रविष्ट करा.');
      return;
    }

    const newStock = prod.stock + addQty;
    await adjustStock(shopId, prod.$id, newStock, stockInNotes || 'नवीन खरेदी माल (Stock In)');
    setIsStockInOpen(false);
    setStockInProdId('');
    setStockInQty('');
    setStockInNotes('');
    loadData();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-700" />
            <span>{t.navStockMovements} (साठा नोंदवही)</span>
          </h2>
          <p className="text-xs text-slate-500">
            प्रत्येक खरेदी, विक्री आणि साठा दुरुस्तीचा संपूर्ण इतिहास.
          </p>
        </div>

        <button
          onClick={() => setIsStockInOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन साठा भरा (Stock In)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="w-full sm:w-1/2">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">वस्तू निवडा:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="all">-- सर्व वस्तू (All Products) --</option>
            {products.map(p => (
              <option key={p.$id} value={p.$id}>
                {p.name} (उपलब्ध: {p.stock} {p.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">प्रकार निवडा:</label>
          <div className="flex items-center gap-1.5">
            {['all', 'purchase', 'sale', 'adjustment'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                  filterType === type
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'all'
                  ? 'सर्व'
                  : type === 'purchase'
                  ? 'खरेदी (+)'
                  : type === 'sale'
                  ? 'विक्री (-)'
                  : 'दुरुस्ती'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movements History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            कोणतीही साठा नोंद आढळली नाही.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMovements.map(m => {
              const isPlus = m.movementType === 'purchase' || m.movementType === 'return' || m.newStock > m.previousStock;

              return (
                <div key={m.$id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isPlus ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {isPlus ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {m.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateTime(m.createdAt)} • {m.notes || 'नोंद नाही'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm sm:text-base font-black tabular-nums ${isPlus ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPlus ? '+' : '-'}{m.quantity}
                    </p>
                    <p className="text-[10px] text-slate-500 tabular-nums">
                      पूर्वी: {m.previousStock} &rarr; आता: <span className="font-bold text-slate-800">{m.newStock}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stock In Modal */}
      <Modal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title="नवीन साठा भरा (Stock In / Purchase)"
        subtitle="सामान खरेदी किंवा नवीन आवक नोंदवा"
      >
        <form onSubmit={handleStockIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">वस्तू निवडा *</label>
            <select
              required
              value={stockInProdId}
              onChange={(e) => setStockInProdId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- वस्तू निवडा --</option>
              {products.map(p => (
                <option key={p.$id} value={p.$id}>
                  {p.name} (चालू साठा: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">जोडण्याचे प्रमाण (Quantity) *</label>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={stockInQty}
              onChange={(e) => setStockInQty(e.target.value)}
              placeholder="उदा. 25"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">खरेदी संदर्भ / पुरवठादार माहिती</label>
            <input
              type="text"
              value={stockInNotes}
              onChange={(e) => setStockInNotes(e.target.value)}
              placeholder="उदा. मार्केट यार्ड खरेदी, बिल क्र. ४५"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStockInOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              साठा जोडा (Add Stock)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
