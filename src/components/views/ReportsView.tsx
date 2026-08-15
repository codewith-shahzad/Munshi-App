import React, { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, Receipt, Shield, Search, Calendar, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { exportShopReportToExcel, exportProfitReportToPDF } from '../../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const { sales, expenses, activityLogs, stockItems, udhaarPayments, settings } = useShop();
  const { t } = useLanguage();

  const [periodFilter, setPeriodFilter] = useState<'today' | 'thisWeek' | 'thisMonth' | 'allTime' | 'custom'>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Helper date filtering
  const filteredSales = sales.filter(s => {
    const sDate = new Date(s.date);
    const now = new Date();
    if (periodFilter === 'today') {
      return s.date === now.toISOString().split('T')[0];
    }
    if (periodFilter === 'thisWeek') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sDate >= weekAgo;
    }
    if (periodFilter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return sDate >= firstDay;
    }
    if (periodFilter === 'custom') {
      if (customFrom && sDate < new Date(customFrom)) return false;
      if (customTo && sDate > new Date(customTo)) return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    const eDate = new Date(e.date);
    const now = new Date();
    if (periodFilter === 'today') {
      return e.date === now.toISOString().split('T')[0];
    }
    if (periodFilter === 'thisWeek') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eDate >= weekAgo;
    }
    if (periodFilter === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return eDate >= firstDay;
    }
    if (periodFilter === 'custom') {
      if (customFrom && eDate < new Date(customFrom)) return false;
      if (customTo && eDate > new Date(customTo)) return false;
    }
    return true;
  });

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const grossProfit = totalSalesAmount - totalCOGS;
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSalesAmount - totalCOGS - totalExpensesAmount;

  // Dynamic 3-partner profit distribution
  const partnerShares = (settings.partners || []).map(p => ({
    ...p,
    amount: (netProfit * p.sharePercent) / 100
  }));

  // Expense breakdown by category
  const expenseCategoriesMap = new Map<string, number>();
  filteredExpenses.forEach(e => {
    const current = expenseCategoriesMap.get(e.category) || 0;
    expenseCategoriesMap.set(e.category, current + e.amount);
  });

  // Filter activity logs
  const filteredLogs = activityLogs.filter(log => 
    log.entityName.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.partnerRole.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  const getPeriodLabel = () => {
    if (periodFilter === 'today') return 'Daily Report (Today)';
    if (periodFilter === 'thisWeek') return 'Weekly Report (Last 7 Days)';
    if (periodFilter === 'thisMonth') return 'Monthly Report';
    if (periodFilter === 'custom') return `Custom Range (${customFrom || 'Start'} to ${customTo || 'End'})`;
    return 'All-Time Report';
  };

  const handleExportExcel = () => {
    exportShopReportToExcel({
      sales: filteredSales,
      expenses: filteredExpenses,
      stockItems,
      udhaarPayments,
      reportTitle: `${settings.shopName} - ${getPeriodLabel()}`
    });
  };

  const handleExportPDF = () => {
    exportProfitReportToPDF({
      reportTitle: `${settings.shopName} - ${getPeriodLabel()}`,
      period: getPeriodLabel(),
      totalSales: totalSalesAmount,
      cogs: totalCOGS,
      grossProfit,
      expenses: totalExpensesAmount,
      netProfit,
      partnerShares
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {t('reportsTitle')}
          </h2>
          <p className="text-xs text-slate-600">
            Instant daily/weekly financial breakdown, 3-partner profit split, and Excel/PDF export
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="Download Excel Sheet without errors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3.5 py-2 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="Download PDF Report"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center space-x-1 rtl:space-x-reverse bg-white p-1.5 rounded-xl border border-amber-900/10 shadow-xs text-xs overflow-x-auto">
        <button
          onClick={() => setPeriodFilter('today')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'today' ? 'bg-[#1F2A44] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily (Today)
        </button>
        <button
          onClick={() => setPeriodFilter('thisWeek')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'thisWeek' ? 'bg-[#1F2A44] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Weekly (7 Days)
        </button>
        <button
          onClick={() => setPeriodFilter('thisMonth')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'thisMonth' ? 'bg-[#1F2A44] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('thisMonth')}
        </button>
        <button
          onClick={() => setPeriodFilter('allTime')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'allTime' ? 'bg-[#1F2A44] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('all')}
        </button>
        <button
          onClick={() => setPeriodFilter('custom')}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            periodFilter === 'custom' ? 'bg-[#1F2A44] text-amber-300 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('customRange')}
        </button>
      </div>

      {periodFilter === 'custom' && (
        <div className="flex items-center space-x-3 rtl:space-x-reverse text-xs bg-white p-3 rounded-xl border border-amber-900/10 shadow-xs">
          <label className="font-semibold text-slate-700">{t('fromDate')}:</label>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          />
          <label className="font-semibold text-slate-700">{t('toDate')}:</label>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          />
        </div>
      )}

      {/* Main Profit Breakdown Card */}
      <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-100 pb-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900">
              {t('netProfitDistribution')} ({getPeriodLabel()})
            </h3>
            <p className="text-xs text-slate-500">
              Formula: Net Profit = Total Sales − Purchase Cost (COGS) − Operational Expenses
            </p>
          </div>
        </div>

        {/* Calculation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('totalSales')}</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
              Rs. {totalSalesAmount.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('cogs')}</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-700 mt-1">
              Rs. {totalCOGS.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('grossProfit')}</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
              Rs. {grossProfit.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('totalExpensesLabel')}</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-red-700 mt-1">
              Rs. {totalExpensesAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Highlighted Net Outcome Box */}
        <div className={`p-6 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              {netProfit >= 0 ? (
                <TrendingUp className="w-7 h-7 text-[#3F7A5A]" />
              ) : (
                <TrendingDown className="w-7 h-7 text-red-700" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  {netProfit >= 0 ? t('netProfit') : t('netLoss')}
                </span>
                <span className="text-xs text-slate-500">
                  {netProfit >= 0 ? 'Net income ready for partner distribution' : 'Business deficit for this period'}
                </span>
              </div>
            </div>

            <span className={`text-3xl font-bold font-mono ${netProfit >= 0 ? 'text-[#3F7A5A]' : 'text-red-700'}`}>
              Rs. {Math.abs(netProfit).toLocaleString()}
            </span>
          </div>

          {netProfit < 0 && (
            <p className="text-xs text-red-700 font-bold bg-red-100 p-3 rounded-xl border border-red-200">
              {t('lossWarningNotice')}
            </p>
          )}

          {/* 3 Partner Share Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {partnerShares.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F2A44] truncate">{p.name}</span>
                  <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold font-mono">
                    {p.sharePercent}%
                  </span>
                </div>
                <div className={`text-xl font-bold font-mono ${p.amount >= 0 ? 'text-[#3F7A5A]' : 'text-red-700'}`}>
                  Rs. {Math.round(p.amount).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500">
                  {p.sharePercent}% of {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown Chart List */}
      <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Receipt className="w-5 h-5 text-amber-800" />
          <h3 className="text-base font-serif font-bold text-slate-900">
            Expense Breakdown by Category
          </h3>
        </div>

        {expenseCategoriesMap.size === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No expenses recorded for this period.
          </p>
        ) : (
          <div className="space-y-3">
            {Array.from(expenseCategoriesMap.entries()).map(([cat, amt]) => {
              const pct = totalExpensesAmount > 0 ? (amt / totalExpensesAmount) * 100 : 0;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>{cat}</span>
                    <span className="font-mono font-bold">Rs. {amt.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B2E3C]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permanent Read-Only Activity Audit Log */}
      <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <Shield className="w-5 h-5 text-amber-800" />
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">
                {t('activityAuditLog')}
              </h3>
              <p className="text-xs text-slate-500">
                Permanent, immutable history of all edits, additions, and deletions by all partners
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search audit log..."
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs">
            <thead>
              <tr className="bg-[#1F2A44] text-slate-200 border-b border-amber-900/20 font-serif">
                <th className="py-3 px-3 font-semibold">{t('timestamp')}</th>
                <th className="py-3 px-3 font-semibold">{t('partner')}</th>
                <th className="py-3 px-3 font-semibold">{t('activityType')}</th>
                <th className="py-3 px-3 font-semibold">{t('entity')}</th>
                <th className="py-3 px-3 font-semibold">{t('details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2A44] text-amber-300">
                        {log.partnerRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold uppercase text-[10px] tracking-wider text-slate-600">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {log.entityName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
