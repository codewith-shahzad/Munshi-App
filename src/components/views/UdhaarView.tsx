import React, { useState } from 'react';
import { CreditCard, Plus, Search, AlertCircle, Edit2, Trash2, Check, X, ArrowUpDown } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { UdhaarPayment } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

export const UdhaarView: React.FC = () => {
  const { 
    shopkeepers, 
    totalOutstandingUdhaar, 
    udhaarPayments, 
    addUdhaarPayment, 
    editUdhaarPayment, 
    deleteUdhaarPayment 
  } = useShop();

  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<UdhaarPayment | null>(null);

  // Form Fields
  const [shopkeeperName, setShopkeeperName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [paymentToDelete, setPaymentToDelete] = useState<UdhaarPayment | null>(null);

  const udhaarLimit = 100000;
  const udhaarPercent = Math.min(100, (totalOutstandingUdhaar / udhaarLimit) * 100);
  const isOverLimit = totalOutstandingUdhaar > udhaarLimit;

  const openPaymentModal = (prefillCustomerName?: string) => {
    setEditingPayment(null);
    setShopkeeperName(prefillCustomerName || (shopkeepers.length > 0 ? shopkeepers[0].name : ''));
    setAmount('');
    setNote('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (payment: UdhaarPayment) => {
    setEditingPayment(payment);
    setShopkeeperName(payment.shopkeeperName);
    setAmount(payment.amount.toString());
    setNote(payment.note || '');
    setPaymentDate(payment.date);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!shopkeeperName.trim()) {
      setFormError(t('errRequired'));
      return;
    }

    const aNum = parseFloat(amount);
    if (isNaN(aNum) || aNum <= 0) {
      setFormError(t('errMinZero'));
      return;
    }

    try {
      if (editingPayment) {
        await editUdhaarPayment(editingPayment.id, shopkeeperName, aNum, note, paymentDate);
      } else {
        await addUdhaarPayment(shopkeeperName, aNum, note, paymentDate);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error recording payment');
    }
  };

  const handleDeleteConfirm = async () => {
    if (paymentToDelete) {
      await deleteUdhaarPayment(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  const filteredShopkeepers = shopkeepers.filter(sk =>
    sk.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPayments = udhaarPayments.filter(p =>
    p.shopkeeperName.toLowerCase().includes(search.toLowerCase()) ||
    (p.note && p.note.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('udhaarTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Track shopkeeper credit balances and record payment collections
          </p>
        </div>

        <button
          onClick={() => openPaymentModal()}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>{t('recordPayment')}</span>
        </button>
      </div>

      {/* Udhaar Outstanding Progress Limit Bar */}
      <div className={`p-5 rounded-2xl border ${isOverLimit ? 'bg-red-500/10 border-red-300' : 'bg-white border-amber-900/10'} shadow-sm space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <CreditCard className={`w-6 h-6 ${isOverLimit ? 'text-red-700' : 'text-amber-700'}`} />
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                {t('totalUdhaar')} ({t('udhaarLimit')})
              </h3>
              <p className="text-xs text-slate-500">
                {shopkeepers.length} active customer credit account(s)
              </p>
            </div>
          </div>

          <div className="text-right rtl:text-left font-mono">
            <span className={`text-2xl font-bold ${isOverLimit ? 'text-red-700' : 'text-slate-900'}`}>
              Rs. {totalOutstandingUdhaar.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 block">/ 1,00,000 PKR</span>
          </div>
        </div>

        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-red-600 animate-pulse' : 'bg-amber-500'}`}
            style={{ width: `${udhaarPercent}%` }}
          />
        </div>

        {isOverLimit && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-red-800 font-bold bg-red-100 p-3 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{t('overLimitNotice')}</span>
          </div>
        )}
      </div>

      {/* Controls Bar & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-900/10 shadow-sm">
        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-100 p-1 rounded-lg text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${activeTab === 'balances' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('customerList')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t('paymentHistory')}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
          />
        </div>
      </div>

      {/* Main Content: Balances vs History */}
      {activeTab === 'balances' ? (
        <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                  <th className="py-3.5 px-4 font-semibold">{t('shopkeeperName')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('totalCreditGiven')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('totalPaid')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('netBalance')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredShopkeepers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      {t('noRecords')}
                    </td>
                  </tr>
                ) : (
                  filteredShopkeepers.map((sk) => {
                    const isOwed = sk.netBalanceDue > 0;
                    return (
                      <tr key={sk.name} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {sk.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          Rs. {sk.totalCreditSales.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700 font-medium">
                          Rs. {sk.totalPayments.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isOwed ? 'text-red-700' : 'text-emerald-800'}>
                            Rs. {sk.netBalanceDue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openPaymentModal(sk.name)}
                            className="px-3 py-1 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer inline-flex items-center space-x-1 rtl:space-x-reverse"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-300" />
                            <span>{t('recordPaymentBtn')}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">{t('shopkeeperName')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('paymentAmount')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('notes')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('soldBy')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      {t('noRecords')}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {p.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.shopkeeperName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        Rs. {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.note || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.createdByRole.includes('Partner 1')
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {p.createdByRole.includes('Partner 1') ? 'P1' : 'P2'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-600 hover:text-[#8B2E3C] hover:bg-slate-100 rounded-lg transition"
                            title={t('edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPaymentToDelete(p)}
                            className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record / Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <CreditCard className="w-5 h-5 text-amber-800" />
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {editingPayment ? t('edit') : t('recordPayment')}
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
                  {t('shopkeeperName')} *
                </label>
                <input
                  type="text"
                  required
                  list="sk-list"
                  value={shopkeeperName}
                  onChange={(e) => setShopkeeperName(e.target.value)}
                  placeholder={t('shopkeeperPlaceholder')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
                <datalist id="sk-list">
                  {shopkeepers.map(sk => (
                    <option key={sk.name} value={sk.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('paymentAmount')} *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('notes')} ({t('optional')})
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Received via JazzCash / Cash"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

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
                  <span>{editingPayment ? t('update') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(paymentToDelete)}
        title={t('delete')}
        message={t('deletePaymentConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPaymentToDelete(null)}
      />
    </div>
  );
};
