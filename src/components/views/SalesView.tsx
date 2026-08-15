import React, { useState } from 'react';
import { ShoppingCart, Plus, Search, Edit2, Trash2, Calendar, Check, X, AlertCircle, Receipt, TrendingUp, Image as ImageIcon, Camera } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Sale, PaymentType } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { BillModal } from '../BillModal';
import { BillImageUploader } from '../BillImageUploader';
import { BillPhotoModal } from '../BillPhotoModal';

export const SalesView: React.FC = () => {
  const { stockItems, sales, addSale, editSale, deleteSale, shopkeepers, settings } = useShop();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | 'month' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Bill Modal state
  const [selectedBillSale, setSelectedBillSale] = useState<Sale | null>(null);

  // Photo Inspection Modal state
  const [inspectingSalePhoto, setInspectingSalePhoto] = useState<Sale | null>(null);

  // Form fields
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [billImageUrl, setBillImageUrl] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const selectedStockItem = stockItems.find(i => i.id === selectedItemId);

  const openAddModal = () => {
    setEditingSale(null);
    setSelectedItemId(stockItems.length > 0 ? stockItems[0].id : '');
    setQuantity('');
    setSalePrice('');
    setPaymentType('cash');
    setShopkeeperName('');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setBillImageUrl(undefined);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedItemId(sale.itemId);
    setQuantity(sale.quantity.toString());
    setSalePrice(sale.salePrice.toString());
    setPaymentType(sale.paymentType);
    setShopkeeperName(sale.shopkeeperName || '');
    setSaleDate(sale.date);
    setBillImageUrl(sale.billImageUrl);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleStockSelectChange = (id: string) => {
    setSelectedItemId(id);
    const item = stockItems.find(i => i.id === id);
    if (item && !salePrice) {
      setSalePrice(item.purchasePrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedItemId) {
      setFormError('Please select a stock item.');
      return;
    }

    const qNum = parseFloat(quantity);
    const pNum = parseFloat(salePrice);

    if (isNaN(qNum) || qNum <= 0) {
      setFormError(t('errMinZero'));
      return;
    }

    if (isNaN(pNum) || pNum < 0) {
      setFormError(t('errMinZero'));
      return;
    }

    if (paymentType === 'credit' && !shopkeeperName.trim()) {
      setFormError(t('errRequired'));
      return;
    }

    try {
      if (editingSale) {
        await editSale(editingSale.id, qNum, pNum, paymentType, shopkeeperName, saleDate, billImageUrl);
      } else {
        await addSale(selectedItemId, qNum, pNum, paymentType, shopkeeperName, saleDate, undefined, billImageUrl);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving sale entry');
    }
  };

  const handleDeleteConfirm = async () => {
    if (saleToDelete) {
      await deleteSale(saleToDelete.id);
      setSaleToDelete(null);
    }
  };

  // Date Filtering logic
  const filteredSales = sales.filter(s => {
    const matchesSearch = 
      s.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (s.shopkeeperName && s.shopkeeperName.toLowerCase().includes(search.toLowerCase())) ||
      (s.invoiceNo && s.invoiceNo.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(s.date) >= sevenDaysAgo;
    }

    if (dateFilter === 'month') {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return new Date(s.date) >= firstDayOfMonth;
    }

    if (dateFilter === 'custom') {
      if (customFrom && new Date(s.date) < new Date(customFrom)) return false;
      if (customTo && new Date(s.date) > new Date(customTo)) return false;
    }

    return true;
  });

  const totalFilteredSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalFilteredProfit = filteredSales.reduce((sum, s) => sum + ((s.salePrice - s.purchasePrice) * s.quantity), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('salesTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Auto-generate customer bills, calculate profits, and record cash/credit sales
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>{t('recordSale')}</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-900/10 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, customer, invoice..."
            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
          />
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-100 p-1 rounded-lg text-xs w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${dateFilter === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('last7Days')}
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${dateFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('thisMonth')}
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${dateFilter === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('customRange')}
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
            />
            <span>to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
            />
          </div>
        )}

        <div className="flex items-center space-x-3 text-xs font-semibold font-mono">
          <span>Sales: <strong className="text-slate-900">Rs. {totalFilteredSalesAmount.toLocaleString()}</strong></span>
          <span>•</span>
          <span className="text-emerald-800">Gross Profit: <strong>Rs. {totalFilteredProfit.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Sales Log Table */}
      <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th className="py-3.5 px-4 font-semibold">{t('dateLabel')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('itemName')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('quantity')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('salePrice')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('totalAmount')}</th>
                <th className="py-3.5 px-4 font-semibold">Gross Profit</th>
                <th className="py-3.5 px-4 font-semibold">{t('paymentType')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('soldBy')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('saleBillPhoto')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    {t('noRecords')}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCredit = sale.paymentType === 'credit';
                  const saleProfit = (sale.salePrice - sale.purchasePrice) * sale.quantity;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {sale.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{sale.itemName}</div>
                        {sale.invoiceNo && (
                          <span className="text-[10px] font-mono text-slate-400">#{sale.invoiceNo}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {sale.quantity} {sale.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        Rs. {sale.salePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        Rs. {sale.totalSaleAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        Rs. {saleProfit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 rtl:space-x-reverse ${
                          isCredit 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-[#3F7A5A] border border-emerald-300'
                        }`}>
                          <span>{isCredit ? t('credit') : t('cash')}</span>
                          {isCredit && sale.shopkeeperName && (
                            <span className="font-normal text-amber-800">({sale.shopkeeperName})</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2A44] text-amber-300">
                          {sale.createdByRole || 'Partner'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sale.billImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setInspectingSalePhoto(sale)}
                            className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-800/30 rounded-lg text-xs font-medium transition cursor-pointer shadow-2xs group"
                            title={t('viewBillPhoto')}
                          >
                            <img
                              src={sale.billImageUrl}
                              alt="Slip thumbnail"
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
                        <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                          <button
                            onClick={() => setSelectedBillSale(sale)}
                            className="p-1.5 text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition"
                            title="Generate Bill / Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(sale)}
                            className="p-1.5 text-slate-600 hover:text-[#8B2E3C] hover:bg-slate-100 rounded-lg transition"
                            title={t('edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSaleToDelete(sale)}
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

      {/* Record / Edit Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <ShoppingCart className="w-5 h-5 text-amber-800" />
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {editingSale ? t('editSale') : t('recordSale')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('selectStockItem')} *
                </label>
                <select
                  disabled={Boolean(editingSale)}
                  value={selectedItemId}
                  onChange={(e) => handleStockSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                >
                  <option value="">{t('selectStockItem')}</option>
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity} {item.unit} @ Cost Rs. {item.purchasePrice})
                    </option>
                  ))}
                </select>
                {selectedStockItem && (
                  <p className="mt-1 text-xs text-slate-600 flex items-center space-x-1 rtl:space-x-reverse">
                    <span>{t('availableQty')}:</span>
                    <strong className="text-slate-900 font-mono">
                      {editingSale ? selectedStockItem.quantity + editingSale.quantity : selectedStockItem.quantity} {selectedStockItem.unit}
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1 rtl:space-x-reverse">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('dateLabel')} *</span>
                </label>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('salePrice')} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="e.g. 210"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('paymentType')} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      paymentType === 'cash'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {t('cash')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('credit')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      paymentType === 'credit'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {t('credit')}
                  </button>
                </div>
              </div>

              {/* Shopkeeper Name input if Credit or optional for invoice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('shopkeeperName')} {paymentType === 'credit' ? '*' : `(${t('optional')})`}
                </label>
                <input
                  type="text"
                  required={paymentType === 'credit'}
                  list="shopkeeper-options"
                  value={shopkeeperName}
                  onChange={(e) => setShopkeeperName(e.target.value)}
                  placeholder={t('shopkeeperPlaceholder')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
                <datalist id="shopkeeper-options">
                  {shopkeepers.map(sk => (
                    <option key={sk.name} value={sk.name} />
                  ))}
                </datalist>
              </div>

              {/* Bill / Slip Photo Attachment */}
              <BillImageUploader
                value={billImageUrl}
                onChange={setBillImageUrl}
                label={t('attachBillPhoto')}
                onPreviewFullscreen={(url) => {
                  setInspectingSalePhoto({
                    id: editingSale?.id || 'new',
                    itemId: selectedItemId,
                    itemName: selectedStockItem?.name || 'Sale Item',
                    unit: selectedStockItem?.unit || 'pcs',
                    quantity: parseFloat(quantity) || 0,
                    purchasePrice: selectedStockItem?.purchasePrice || 0,
                    salePrice: parseFloat(salePrice) || 0,
                    totalSaleAmount: (parseFloat(quantity) || 0) * (parseFloat(salePrice) || 0),
                    paymentType,
                    shopkeeperName,
                    date: saleDate,
                    billImageUrl: url,
                    createdAt: Date.now(),
                    createdByRole: ''
                  });
                }}
              />

              {formError && (
                <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-xs text-red-700 font-semibold flex items-center space-x-1.5 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
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
                  <span>{editingSale ? t('update') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Photo Lightbox Modal */}
      <BillPhotoModal
        isOpen={Boolean(inspectingSalePhoto && inspectingSalePhoto.billImageUrl)}
        imageUrl={inspectingSalePhoto?.billImageUrl}
        title={`${t('saleBillPhoto')} - ${inspectingSalePhoto?.itemName || ''}`}
        subtitle={`${inspectingSalePhoto?.quantity} ${inspectingSalePhoto?.unit} @ Rs. ${inspectingSalePhoto?.salePrice.toLocaleString()} (${inspectingSalePhoto?.paymentType === 'credit' ? 'Credit' : 'Cash'})`}
        metaInfo={[
          { label: 'Invoice', value: inspectingSalePhoto?.invoiceNo || '-' },
          { label: 'Customer', value: inspectingSalePhoto?.shopkeeperName || 'Walk-in' },
          { label: 'Date', value: inspectingSalePhoto?.date || '-' },
          { label: 'Total Amount', value: `Rs. ${(inspectingSalePhoto?.totalSaleAmount || 0).toLocaleString()}` }
        ]}
        onClose={() => setInspectingSalePhoto(null)}
      />

      {/* Bill / Invoice View & Download Modal */}
      <BillModal
        isOpen={Boolean(selectedBillSale)}
        sale={selectedBillSale}
        settings={settings}
        onClose={() => setSelectedBillSale(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(saleToDelete)}
        title={t('delete')}
        message={t('deleteSaleConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setSaleToDelete(null)}
      />
    </div>
  );
};
