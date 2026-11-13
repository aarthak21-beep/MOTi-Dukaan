import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  adjustStock 
} from '../services/storage';
import { Product, UnitType } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Products: React.FC = () => {
  const { t, formatCurrency } = useLanguage();
  const { shop } = useAuth();
  const shopId = shop?.$id || 'shop_moti_demo';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add / Edit Modal
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('groceries');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState<UnitType>('piece');
  const [lowStockLimit, setLowStockLimit] = useState('5');

  // Quick Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustedStockQty, setAdjustedStockQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('नवीन खरेदी / साठा भरणा');

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getProducts(shopId);
      setProducts(data);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const categories = [
    { id: 'all', label: 'सर्व (All)' },
    { id: 'groceries', label: t.cat_groceries },
    { id: 'pulses', label: t.cat_pulses },
    { id: 'oil_ghee', label: t.cat_oil_ghee },
    { id: 'spices', label: t.cat_spices },
    { id: 'snacks', label: t.cat_snacks },
    { id: 'soaps_cleaning', label: t.cat_soaps_cleaning },
    { id: 'beverages', label: t.cat_beverages },
    { id: 'dairy', label: t.cat_dairy },
    { id: 'general', label: t.cat_general },
  ];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const lowStockCount = products.filter(p => p.stock <= (p.lowStockLimit || 5)).length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setCategory('groceries');
    setPurchasePrice('');
    setSellingPrice('');
    setStock('');
    setUnit('piece');
    setLowStockLimit('5');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setPurchasePrice(prod.purchasePrice.toString());
    setSellingPrice(prod.sellingPrice.toString());
    setStock(prod.stock.toString());
    setUnit(prod.unit);
    setLowStockLimit((prod.lowStockLimit || 5).toString());
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sellingPrice) return;

    if (editingProduct) {
      await updateProduct({
        ...editingProduct,
        name,
        sku,
        category,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        stock: parseFloat(stock) || 0,
        unit,
        lowStockLimit: parseFloat(lowStockLimit) || 5,
      });
    } else {
      await createProduct({
        shopId,
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
        category,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        stock: parseFloat(stock) || 0,
        unit,
        lowStockLimit: parseFloat(lowStockLimit) || 5,
      });
    }

    setIsAddEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProduct(deleteId);
    setDeleteId(null);
    loadData();
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustedStockQty) return;

    const newStock = parseFloat(adjustedStockQty);
    if (isNaN(newStock) || newStock < 0) {
      alert('कृपया वैध साठा संख्या प्रविष्ट करा.');
      return;
    }

    await adjustStock(shopId, adjustingProduct.$id, newStock, adjustReason);
    setAdjustingProduct(null);
    setAdjustedStockQty('');
    loadData();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-700" />
            <span>{t.productsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            एकूण उत्पादने: <span className="font-bold text-slate-800 tabular-nums">{products.length}</span> • कमी साठा असलेल्या वस्तू: <span className="font-bold text-rose-700 tabular-nums">{lowStockCount}</span>
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.actionAddProduct}</span>
        </button>
      </div>

      {/* Search & Categories */}
      <div className="space-y-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="वस्तूचे नाव किंवा बारकोड शोधा..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            कोणतीही वस्तू आढळली नाही.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">{t.productName}</th>
                  <th className="py-3 px-3">SKU / कोड</th>
                  <th className="py-3 px-3 text-right">{t.purchasePrice}</th>
                  <th className="py-3 px-3 text-right">{t.sellingPrice}</th>
                  <th className="py-3 px-3 text-center">{t.availableStock}</th>
                  <th className="py-3 px-3 text-center">{t.stockStatus}</th>
                  <th className="py-3 px-4 text-right">कृती (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const isLow = product.stock <= (product.lowStockLimit || 5);
                  const isOut = product.stock <= 0;

                  return (
                    <tr key={product.$id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {product.sku || '-'}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-emerald-800 tabular-nums">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold tabular-nums text-slate-900">
                          {product.stock}
                        </span>{' '}
                        <span className="text-[10px] text-slate-500">{product.unit}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {t.stockOut}
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {t.stockLow}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {t.stockInStock}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock adjustment button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(product);
                              setAdjustedStockQty(product.stock.toString());
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title={t.stockAdjustment}
                          >
                            <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                            साठा बदला
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                            title={t.actionEdit}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteId(product.$id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title={t.actionDelete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingProduct ? 'वस्तू माहिती बदला' : t.actionAddProduct}
      >
        <form onSubmit={handleSaveProduct} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t.productName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="उदा. सोन्या शेंगदाणा तेल १ लिटर"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.productSKU}</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU किंवा बारकोड"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.productCategory}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="groceries">{t.cat_groceries}</option>
                <option value="pulses">{t.cat_pulses}</option>
                <option value="oil_ghee">{t.cat_oil_ghee}</option>
                <option value="spices">{t.cat_spices}</option>
                <option value="snacks">{t.cat_snacks}</option>
                <option value="soaps_cleaning">{t.cat_soaps_cleaning}</option>
                <option value="beverages">{t.cat_beverages}</option>
                <option value="dairy">{t.cat_dairy}</option>
                <option value="general">{t.cat_general}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.unit}</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="piece">{t.unit_piece}</option>
                <option value="packet">{t.unit_packet}</option>
                <option value="kg">{t.unit_kg}</option>
                <option value="gram">{t.unit_gram}</option>
                <option value="litre">{t.unit_litre}</option>
                <option value="ml">{t.unit_ml}</option>
                <option value="box">{t.unit_box}</option>
                <option value="dozen">{t.unit_dozen}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.lowStockLimit}</label>
              <input
                type="number"
                min="0"
                value={lowStockLimit}
                onChange={(e) => setLowStockLimit(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.purchasePrice}</label>
              <input
                type="number"
                step="any"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
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
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="120"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.availableStock}</label>
              <input
                type="number"
                step="any"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
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

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`${t.stockAdjustment} - ${adjustingProduct?.name}`}
        subtitle={`सध्याचा उपलब्ध साठा: ${adjustingProduct?.stock} ${adjustingProduct?.unit}`}
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">नवीन साठा संख्या ({adjustingProduct?.unit}) *</label>
            <input
              type="number"
              step="any"
              required
              min="0"
              value={adjustedStockQty}
              onChange={(e) => setAdjustedStockQty(e.target.value)}
              placeholder="नवीन साठा संख्या"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">बदलाचे कारण / संदर्भ</label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="नवीन खरेदी / साठा भरणा (Stock In)">नवीन खरेदी / साठा भरणा (Stock In)</option>
              <option value="मॅन्युअल दुरुस्ती (Stock Correction)">मॅन्युअल दुरुस्ती (Stock Correction)</option>
              <option value="नुकसानी / एक्सपायरी (Damage / Expired)">नुकसानी / एक्सपायरी (Damage / Expired)</option>
              <option value="ग्राहक परतावा (Return In)">ग्राहक परतावा (Return In)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustingProduct(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {t.actionCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              साठा अद्ययावत करा (Save)
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
        message="तुम्हाला खात्री आहे की तुम्ही ही वस्तू हटवू इच्छिता? ही कृती पूर्ववत करता येणार नाही."
      />
    </div>
  );
};
