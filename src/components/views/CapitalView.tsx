import React, { useState } from 'react';
import { Landmark, Plus, Edit2, Trash2, Check, X, AlertCircle, Users, Wallet } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CapitalContribution } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

export const CapitalView: React.FC = () => {
  const { capitalContributions, totalCapitalRaised, addCapitalContribution, editCapitalContribution, deleteCapitalContribution, settings } = useShop();
  const { t } = useLanguage();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapital, setEditingCapital] = useState<CapitalContribution | null>(null);

  const defaultContributor = settings.partners?.[0]?.name || 'Partner 1';

  // Form State
  const [contributorName, setContributorName] = useState(defaultContributor);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [capDate, setCapDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [capitalToDelete, setCapitalToDelete] = useState<CapitalContribution | null>(null);

  // Group capital contributions by contributor
  const contributorBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    capitalContributions.forEach(c => {
      const name = c.contributorName.trim() || 'Unassigned';
      map.set(name, (map.get(name) || 0) + c.amount);
    });
    return Array.from(map.entries()).map(([name, total]) => ({
      name,
      total,
      percentage: totalCapitalRaised > 0 ? ((total / totalCapitalRaised) * 100).toFixed(1) : '0'
    }));
  }, [capitalContributions, totalCapitalRaised]);

  const openAddModal = () => {
    setEditingCapital(null);
    setContributorName(defaultContributor);
    setAmount('');
    setNote('');
    setCapDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cap: CapitalContribution) => {
    setEditingCapital(cap);
    setContributorName(cap.contributorName);
    setAmount(cap.amount.toString());
    setNote(cap.note || '');
    setCapDate(cap.date);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!contributorName.trim()) {
      setFormError(t('errRequired'));
      return;
    }

    const aNum = parseFloat(amount);
    if (isNaN(aNum) || aNum <= 0) {
      setFormError(t('errMinZero'));
      return;
    }

    try {
      if (editingCapital) {
        await editCapitalContribution(editingCapital.id, contributorName, aNum, note, capDate);
      } else {
        await addCapitalContribution(contributorName, aNum, note, capDate);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving capital entry');
    }
  };

  const handleDeleteConfirm = async () => {
    if (capitalToDelete) {
      await deleteCapitalContribution(capitalToDelete.id);
      setCapitalToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('capitalTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Unlimited open capital & investment fund ledger for all partners
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>{t('recordCapital')}</span>
        </button>
      </div>

      {/* Capital Summary Card & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Capital Fund Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="p-3 bg-emerald-50 text-[#3F7A5A] rounded-xl border border-emerald-200">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('totalInvested')}
                </span>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 font-mono">
                  Rs. {totalCapitalRaised.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Total active investment fund in the business. No artificial caps or limits.
          </p>
        </div>

        {/* Contributor Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse border-b border-slate-100 pb-2">
            <Wallet className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-serif font-bold text-slate-900">
              Capital Contribution by Partner / Investor
            </h3>
          </div>

          {contributorBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 italic">
              No capital records logged yet. Click &quot;Add Investment&quot; to begin.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {contributorBreakdown.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{item.percentage}%</span>
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    Rs. {item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contributions History Table */}
      <div className="bg-white rounded-xl border border-amber-900/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th className="py-3.5 px-4 font-semibold">{t('dateLabel')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('contributorName')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('paymentAmount')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('notes')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('soldBy')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {capitalContributions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    {t('noRecords')}
                  </td>
                </tr>
              ) : (
                capitalContributions.map((cap) => (
                  <tr key={cap.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {cap.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {cap.contributorName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#3F7A5A]">
                      Rs. {cap.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cap.note || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2A44] text-amber-300">
                        {cap.createdByRole || 'Partner'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => openEditModal(cap)}
                          className="p-1.5 text-slate-600 hover:text-[#8B2E3C] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCapitalToDelete(cap)}
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

      {/* Record / Edit Capital Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Landmark className="w-5 h-5 text-amber-800" />
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {editingCapital ? t('edit') : t('recordCapital')}
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
                  {t('contributorName')} *
                </label>
                <input
                  type="text"
                  required
                  list="partner-contributors"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder={t('contributorPlaceholder')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
                <datalist id="partner-contributors">
                  {settings.partners?.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                  <option value="External Investor" />
                </datalist>
              </div>

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
                  placeholder="e.g. 100000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('dateLabel')} *
                </label>
                <input
                  type="date"
                  required
                  value={capDate}
                  onChange={(e) => setCapDate(e.target.value)}
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
                  placeholder="e.g. Cash injection / Bank transfer"
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
                  <span>{editingCapital ? t('update') : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(capitalToDelete)}
        title={t('delete')}
        message={t('deleteCapitalConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCapitalToDelete(null)}
      />
    </div>
  );
};
