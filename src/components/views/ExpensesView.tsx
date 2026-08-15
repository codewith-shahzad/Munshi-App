import React, { useState } from 'react';
import { Receipt, Plus, Search, Edit2, Trash2, Check, X, AlertCircle, Calendar } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Expense, ExpenseCategory } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, editExpense, deleteExpense } = useShop();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('Shop rent');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [details, setDetails] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const categoriesList: { key: ExpenseCategory; label: string }[] = [
    { key: 'Shop rent', label: t('catRent') },
    { key: 'Electricity', label: t('catElectricity') },
    { key: 'Transport / Loader', label: t('catTransport') },
    { key: 'Staff wages', label: t('catWages') },
    { key: 'Damaged stock', label: t('catDamaged') },
    { key: 'Tax', label: t('catTax') },
    { key: 'Other', label: t('catOther') },
  ];

  const openAddModal = () => {
    setEditingExpense(null);
    setCategory('Shop rent');
    setAmount('');
    setNote('');
    setDetails('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setNote(exp.note || '');
    setDetails(exp.details || '');
    setExpenseDate(exp.date);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const aNum = parseFloat(amount);
    if (isNaN(aNum) || aNum <= 0) {
      setFormError(t('errMinZero'));
      return;
    }

    if (category === 'Other' && !details.trim()) {
      setFormError(t('errOtherDetailsRequired'));
      return;
    }

    try {
      if (editingExpense) {
        await editExpense(
          editingExpense.id, 
          category, 
          aNum, 
          note.trim() || undefined, 
          category === 'Other' ? details.trim() : undefined, 
          expenseDate
        );
      } else {
        await addExpense(
          category, 
          aNum, 
          note.trim() || undefined, 
          category === 'Other' ? details.trim() : undefined, 
          expenseDate
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving expense');
    }
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const filtered = expenses.filter(exp => 
    exp.category.toLowerCase().includes(search.toLowerCase()) ||
    (exp.note && exp.note.toLowerCase().includes(search.toLowerCase())) ||
    (exp.details && exp.details.toLowerCase().includes(search.toLowerCase()))
  );

  const totalExpenseVal = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('expensesTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Record shop overheads, rent, wages, transport, and utilities by date
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>{t('recordExpense')}</span>
        </button>
      </div>

      {/* Controls Bar */}
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

        <div className="text-xs font-semibold text-slate-700 font-mono">
          Total Expenses: <strong className="text-red-700 text-sm">Rs. {totalExpenseVal.toLocaleString()}</strong>
        </div>
      </div>

      {/* Expenses Log Table */}
      <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th className="py-3.5 px-4 font-semibold">{t('dateLabel')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('category')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('paymentAmount')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('notes')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('soldBy')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    {t('noRecords')}
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{exp.category}</div>
                      {exp.details && (
                        <div className="text-xs text-amber-900 font-normal mt-0.5">
                          Detail: {exp.details}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-700">
                      Rs. {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {exp.note || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2A44] text-amber-300">
                        {exp.createdByRole || 'Partner'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-slate-600 hover:text-[#8B2E3C] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
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

      {/* Record / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Receipt className="w-5 h-5 text-amber-800" />
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {editingExpense ? t('editExpense') : t('recordExpense')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('category')} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                >
                  {categoriesList.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('otherDetails')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t('otherDetailsPlaceholder')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('paymentAmount')} (PKR) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
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
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
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
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              {formError && (
                <div className="p-2 bg-red-100 text-red-700 text-xs font-medium rounded-lg flex items-center space-x-1 rtl:space-x-reverse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300 transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>{editingExpense ? t('update') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title={t('delete')}
        message={t('deleteExpenseConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
