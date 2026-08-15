import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpDown, X, Check, Calendar, Image as ImageIcon, Camera } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { StockItem } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { BillImageUploader } from '../BillImageUploader';
import { BillPhotoModal } from '../BillPhotoModal';

export const StockView: React.FC = () => {
  const { stockItems, addOrUpdateStock, editStock, deleteStock } = useShop();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'value'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billImageUrl, setBillImageUrl] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Bill Photo Inspection Modal state
  const [inspectingItem, setInspectingItem] = useState<StockItem | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setUnit('pcs');
    setQuantity('');
    setPurchasePrice('');
    setDate(new Date().toISOString().split('T')[0]);
    setBillImageUrl(undefined);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setName(item.name);
    setUnit(item.unit);
    setQuantity(item.quantity.toString());
    setPurchasePrice(item.purchasePrice.toString());
    setDate(item.date || new Date().toISOString().split('T')[0]);
    setBillImageUrl(item.billImageUrl);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError(t('errRequired'));
      return;
    }
    const qNum = parseFloat(quantity);
    const pNum = parseFloat(purchasePrice);

    if (isNaN(qNum) || qNum <= 0) {
      setFormError(t('errMinZero'));
      return;
    }
    if (isNaN(pNum) || pNum < 0) {
      setFormError(t('errMinZero'));
      return;
    }

    try {
      if (editingItem) {
        await editStock(editingItem.id, name, unit, qNum, pNum, date, billImageUrl);
      } else {
        await addOrUpdateStock(name, unit, qNum, pNum, date, billImageUrl);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving stock');
    }
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteStock(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  // Filter & Sort
  const filtered = stockItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.unit.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a.name.toLowerCase();
    let valB: any = b.name.toLowerCase();

    if (sortField === 'quantity') {
      valA = a.quantity;
      valB = b.quantity;
    } else if (sortField === 'value') {
      valA = a.quantity * a.purchasePrice;
      valB = b.quantity * b.purchasePrice;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'name' | 'quantity' | 'value') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('stockTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Manage inventory quantities, purchase costs, and track incoming stock by date
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>{t('addItem')}</span>
        </button>
      </div>

      {/* Controls Bar: Search & Quick Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-900/10 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
          />
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-600 font-medium">
          <span>Total Items: <strong className="text-slate-900">{filtered.length}</strong></span>
          <span>•</span>
          <span>Total Inventory Value: <strong className="text-emerald-800 font-mono font-bold">Rs. {filtered.reduce((s, i) => s + (i.quantity * i.purchasePrice), 0).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th 
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-amber-300"
                >
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span>{t('itemName')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold">{t('dateLabel')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('unit')}</th>
                <th 
                  onClick={() => toggleSort('quantity')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-amber-300"
                >
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span>{t('quantity')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold">{t('purchasePrice')}</th>
                <th 
                  onClick={() => toggleSort('value')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-amber-300"
                >
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <span>{t('totalValue')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('purchaseBillPhoto')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    {t('noRecords')}
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  const itemVal = item.quantity * item.purchasePrice;
                  const isLowStock = item.quantity < 5;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          {isLowStock && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold flex items-center space-x-0.5 rtl:space-x-reverse border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span>{t('lowStockBadge')}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                        {item.date || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        Rs. {item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        Rs. {itemVal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.billImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setInspectingItem(item)}
                            className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-800/30 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs group"
                            title={t('viewPurchaseBill')}
                          >
                            <img
                              src={item.billImageUrl}
                              alt="Bill thumbnail"
                              className="w-5 h-5 rounded object-cover border border-amber-900/20 group-hover:scale-105 transition"
                              referrerPolicy="no-referrer"
                            />
                            <span className="hidden sm:inline">{t('viewBill') || 'View'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-600 hover:text-[#8B2E3C] hover:bg-slate-100 rounded-lg transition"
                            title={t('edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Package className="w-5 h-5 text-amber-800" />
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {editingItem ? t('editItem') : t('addItem')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingItem && (
              <p className="text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200">
                {t('itemExistsNotice')}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('itemName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('itemNamePlaceholder')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1 rtl:space-x-reverse">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('dateLabel')} *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('unit')}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t('unitPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('quantity')} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('purchasePrice')} *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              {/* Purchase Bill / Receipt Photo Uploader */}
              <BillImageUploader
                value={billImageUrl}
                onChange={setBillImageUrl}
                label={t('attachPurchaseBill')}
                onPreviewFullscreen={(url) => {
                  setInspectingItem({
                    id: editingItem?.id || 'new',
                    name: name || 'Purchase Bill',
                    unit,
                    quantity: parseFloat(quantity) || 0,
                    purchasePrice: parseFloat(purchasePrice) || 0,
                    date,
                    billImageUrl: url,
                    updatedAt: Date.now(),
                    createdByRole: ''
                  });
                }}
              />

              {formError && (
                <p className="text-xs text-red-600 font-medium">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center space-x-1.5 rtl:space-x-reverse"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingItem ? t('update') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Photo Lightbox Modal */}
      <BillPhotoModal
        isOpen={Boolean(inspectingItem && inspectingItem.billImageUrl)}
        imageUrl={inspectingItem?.billImageUrl}
        title={`${t('purchaseBillPhoto')} - ${inspectingItem?.name || ''}`}
        subtitle={`${inspectingItem?.quantity} ${inspectingItem?.unit} @ Rs. ${inspectingItem?.purchasePrice.toLocaleString()}`}
        metaInfo={[
          { label: 'Date', value: inspectingItem?.date || '-' },
          { label: 'Total Cost', value: `Rs. ${((inspectingItem?.quantity || 0) * (inspectingItem?.purchasePrice || 0)).toLocaleString()}` },
          { label: 'Item', value: inspectingItem?.name || '' }
        ]}
        onClose={() => setInspectingItem(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title={t('delete')}
        message={t('deleteStockConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
