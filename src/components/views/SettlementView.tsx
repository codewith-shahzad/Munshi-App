import React, { useState } from 'react';
import { Scale, CheckCircle2, History, Clock, Calendar, Users, Percent, Download } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportSettlementStatementToPDF } from '../../utils/exportUtils';

export const SettlementView: React.FC = () => {
  const { 
    sales, 
    expenses, 
    settlements, 
    lastSettlementTimestamp, 
    markAsSettled,
    settings,
    unsettledSales,
    unsettledExpenses,
    unsettledProfit
  } = useShop();
  const { t } = useLanguage();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [settlementNote, setSettlementNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSales = unsettledSales;
  const runningSales = sales.filter(s => s.createdAt > lastSettlementTimestamp);
  const totalCOGS = runningSales.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalExpenses = unsettledExpenses;
  const netProfit = unsettledProfit;

  // Calculate 3-partner dynamic shares
  const partnerShares = (settings.partners || []).map(p => ({
    ...p,
    amount: (netProfit * p.sharePercent) / 100
  }));

  const handleMarkSettled = async () => {
    setIsSubmitting(true);
    try {
      await markAsSettled(settlementNote);
      setIsConfirmOpen(false);
      setSettlementNote('');
    } catch (e) {
      console.error('Failed to settle accounts:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastSettledDate = lastSettlementTimestamp > 0 
    ? new Date(lastSettlementTimestamp).toLocaleString()
    : 'Shop Inception';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('settlementTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            {settings.settlementFrequency === 'weekly' ? 'Weekly' : settings.settlementFrequency === 'fortnightly' ? 'Fortnightly (15 days)' : 'Monthly'} profit calculation & 3-partner distribution
          </p>
        </div>

        <button
          onClick={() => setIsConfirmOpen(true)}
          className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-5 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-amber-300" />
          <span>{t('markAsSettledBtn')}</span>
        </button>
      </div>

      {/* Running Unsettled Period Card */}
      <div className="bg-white rounded-2xl border border-amber-900/10 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-3 bg-[#1F2A44] text-amber-300 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {t('unsettledSummary')}
              </h3>
              <p className="text-xs text-slate-500 flex items-center space-x-1 rtl:space-x-reverse">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Since last settlement: <strong className="text-slate-700">{lastSettledDate}</strong></span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900">
            <Calendar className="w-4 h-4 text-amber-800" />
            <span>Cycle: {settings.settlementFrequency.toUpperCase()}</span>
          </div>
        </div>

        {/* Financial Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('totalSales')}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              Rs. {totalSales.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('cogs')}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              Rs. {totalCOGS.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('totalExpensesLabel')}</span>
            <div className="text-xl font-bold font-mono text-red-700 mt-1">
              Rs. {totalExpenses.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Profit Split Highlight Box for 3 Partners */}
        <div className={`p-5 rounded-xl border ${netProfit >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {netProfit >= 0 ? t('netProfit') : t('netLoss')} Available for Payout
              </span>
              <p className="text-xs text-slate-500">
                Calculated automatically after deducting wholesale purchase cost & all operational expenses
              </p>
            </div>
            <span className={`text-2xl sm:text-3xl font-bold font-mono ${netProfit >= 0 ? 'text-[#3F7A5A]' : 'text-red-700'}`}>
              Rs. {Math.abs(netProfit).toLocaleString()}
            </span>
          </div>

          {netProfit < 0 && (
            <p className="text-xs text-red-700 font-medium">
              {t('lossWarningNotice')}
            </p>
          )}

          {/* 3 Partner Share Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {partnerShares.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F2A44] truncate">{p.name}</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded font-mono">
                    {p.sharePercent}%
                  </span>
                </div>
                <div className={`text-lg font-bold font-mono ${p.amount >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                  Rs. {Math.round(p.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Settlements Archive */}
      <div className="bg-white rounded-2xl border border-amber-900/10 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <History className="w-5 h-5 text-amber-800" />
          <h3 className="text-lg font-serif font-bold text-slate-900">
            {t('settlementHistory')}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th className="py-3 px-4 font-semibold">{t('settledOn')}</th>
                <th className="py-3 px-4 font-semibold">{t('totalSales')}</th>
                <th className="py-3 px-4 font-semibold">{t('netProfit')}</th>
                <th className="py-3 px-4 font-semibold">Partner Payouts</th>
                <th className="py-3 px-4 font-semibold">{t('settledBy')}</th>
                <th className="py-3 px-4 font-semibold text-center">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No past settlements recorded yet.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {new Date(s.settledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      Rs. {s.totalSales.toLocaleString()}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold ${s.netProfit >= 0 ? 'text-[#3F7A5A]' : 'text-red-700'}`}>
                      Rs. {s.netProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {s.partnerShares ? (
                        <div className="space-y-0.5">
                          {s.partnerShares.map((ps, idx) => (
                            <div key={idx} className="text-slate-700">
                              {ps.partnerName} ({ps.sharePercent}%): <strong className="text-emerald-800">Rs. {Math.round(ps.amount).toLocaleString()}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          P1: Rs. {Math.round(s.partner1Share)} | P2: Rs. {Math.round(s.partner2Share)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {s.settledByRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => exportSettlementStatementToPDF(s, settings.shopName)}
                        className="p-1.5 text-[#8B2E3C] hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Download Settlement PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F6F1E4] border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Confirm {settings.settlementFrequency.toUpperCase()} Settlement
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {t('settleConfirmPrompt')}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement Note ({t('optional')})
              </label>
              <input
                type="text"
                value={settlementNote}
                onChange={(e) => setSettlementNote(e.target.value)}
                placeholder="e.g. Fortnightly profit distribution paid via bank/cash"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300 transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleMarkSettled}
                className="px-5 py-2 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-semibold rounded-lg transition shadow-md flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
              >
                <span>{isSubmitting ? 'Settling...' : 'Confirm & Mark as Settled'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
