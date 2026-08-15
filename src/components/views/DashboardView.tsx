import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CreditCard, 
  Landmark, 
  Plus, 
  ShoppingCart, 
  AlertCircle,
  Clock,
  ArrowRight,
  Users,
  Receipt,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { NavTab } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { 
    sales, 
    expenses, 
    stockItems, 
    totalOutstandingUdhaar, 
    totalCapitalRaised,
    activityLogs,
    lastSettlementTimestamp,
    settings
  } = useShop();

  const { t } = useLanguage();

  // Calculate current period numbers (since last settlement)
  const currentSales = sales.filter(s => s.createdAt > lastSettlementTimestamp);
  const currentExpenses = expenses.filter(e => e.createdAt > lastSettlementTimestamp);

  const totalSalesAmount = currentSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalCOGS = currentSales.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalGrossProfit = totalSalesAmount - totalCOGS;
  const totalExp = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalGrossProfit - totalExp;

  const totalStockVal = stockItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);

  // Udhaar Progress (PKR 100,000 limit)
  const udhaarLimit = 100000;
  const udhaarPercent = Math.min(100, (totalOutstandingUdhaar / udhaarLimit) * 100);
  const isUdhaarOverLimit = totalOutstandingUdhaar > udhaarLimit;

  const partners = settings?.partners || [
    { id: 'p1', name: 'Partner 1', role: 'Partner 1', sharePercent: 33.34 },
    { id: 'p2', name: 'Partner 2', role: 'Partner 2', sharePercent: 33.33 },
    { id: 'p3', name: 'Partner 3', role: 'Partner 3', sharePercent: 33.33 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2A44]">
            {t('dashboardTitle')}
          </h2>
          <p className="text-xs text-[#1F2A44]/70 font-medium mt-0.5">
            Real-time live multi-device ledger metrics and 3-partner profit distribution
          </p>
        </div>
        <div className="flex space-x-2.5 rtl:space-x-reverse flex-wrap gap-2">
          <button
            onClick={() => onNavigate('sales')}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#B8892B]" />
            <span>{t('quickSale')}</span>
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2.5 bg-[#1F2A44] hover:bg-[#161f33] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B8892B]" />
            <span>{t('quickStock')}</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#1F2A44] border border-[#1F2A44]/20 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#1F2A44]/10 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-[#1F2A44]/70">
            <span className="text-xs font-bold uppercase tracking-wider">{t('totalSales')}</span>
            <div className="p-2 bg-[#F6F1E4] rounded-xl text-[#B8892B]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2A44] font-mono">
            Rs. {totalSalesAmount.toLocaleString()}
          </div>
          <div className="text-xs text-[#1F2A44]/60 font-medium">
            {currentSales.length} sale(s) in active cycle
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div className="bg-white p-5 rounded-2xl border border-[#1F2A44]/10 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-[#1F2A44]/70">
            <span className="text-xs font-bold uppercase tracking-wider">
              {netProfit >= 0 ? t('netProfit') : t('netLoss')}
            </span>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-[#3F7A5A]/10 text-[#3F7A5A]' : 'bg-[#8B2E3C]/10 text-[#8B2E3C]'}`}>
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-serif font-bold font-mono ${netProfit >= 0 ? 'text-[#3F7A5A]' : 'text-[#8B2E3C]'}`}>
            Rs. {Math.abs(netProfit).toLocaleString()}
          </div>
          <div className="text-xs text-[#1F2A44]/60 font-medium">
            Gross: Rs. {totalGrossProfit.toLocaleString()} | Exp: Rs. {totalExp.toLocaleString()}
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white p-5 rounded-2xl border border-[#1F2A44]/10 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-[#1F2A44]/70">
            <span className="text-xs font-bold uppercase tracking-wider">{t('stockValue')}</span>
            <div className="p-2 bg-[#1F2A44]/10 rounded-xl text-[#1F2A44]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2A44] font-mono">
            Rs. {totalStockVal.toLocaleString()}
          </div>
          <div className="text-xs text-[#1F2A44]/60 font-medium">
            {stockItems.length} product(s) in inventory
          </div>
        </div>

        {/* Total Capital Raised */}
        <div className="bg-white p-5 rounded-2xl border border-[#1F2A44]/10 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-[#1F2A44]/70">
            <span className="text-xs font-bold uppercase tracking-wider">{t('capitalRaised')}</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 font-mono">
            Rs. {totalCapitalRaised.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-700 font-medium">
            {t('capitalUnlimitedDesc')}
          </div>
        </div>
      </div>

      {/* 3-Partner Profit Distribution Snapshot */}
      <div className="bg-white p-6 rounded-2xl border border-[#1F2A44]/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Users className="w-5 h-5 text-[#8B2E3C]" />
            <h3 className="text-base font-serif font-bold text-[#1F2A44]">
              {t('netProfitDistribution')} ({settings.settlementFrequency || 'Weekly'} Cycle)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('settle')}
            className="text-xs text-[#8B2E3C] hover:underline font-bold uppercase tracking-wider flex items-center space-x-1 rtl:space-x-reverse"
          >
            <span>{t('tabSettle')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {partners.map((p, idx) => {
            const shareVal = netProfit > 0 ? (netProfit * p.sharePercent) / 100 : (netProfit * p.sharePercent) / 100;
            return (
              <div 
                key={p.id} 
                className="p-4 rounded-xl border border-amber-900/10 bg-[#F6F1E4]/40 hover:bg-[#F6F1E4] transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-slate-900 text-sm">
                    {p.name}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-[#1F2A44] text-amber-300">
                    {p.sharePercent}%
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {p.role || `Partner ${idx + 1}`}
                </div>
                <div className="pt-1">
                  <div className={`text-xl font-bold font-mono ${shareVal >= 0 ? 'text-[#3F7A5A]' : 'text-red-700'}`}>
                    Rs. {Math.round(shareVal).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {shareVal >= 0 ? 'Estimated Profit Share' : 'Loss Contribution'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Udhaar Credit Monitor Bar */}
      <div className={`bg-white p-5 rounded-2xl border ${isUdhaarOverLimit ? 'border-[#8B2E3C]/40 bg-[#8B2E3C]/5' : 'border-[#1F2A44]/10'} shadow-sm space-y-3`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <CreditCard className={`w-5 h-5 ${isUdhaarOverLimit ? 'text-[#8B2E3C]' : 'text-[#B8892B]'}`} />
            <h3 className="text-sm font-serif font-bold text-[#1F2A44]">
              {t('totalUdhaar')} ({t('udhaarLimit')})
            </h3>
          </div>
          <span className={`text-xs font-bold font-mono ${isUdhaarOverLimit ? 'text-[#8B2E3C]' : 'text-[#1F2A44]'}`}>
            Rs. {totalOutstandingUdhaar.toLocaleString()} / 1,00,000 PKR
          </span>
        </div>

        <div className="w-full h-3 bg-[#F6F1E4] rounded-full overflow-hidden border border-[#1F2A44]/10">
          <div 
            className={`h-full transition-all duration-500 ${isUdhaarOverLimit ? 'bg-[#8B2E3C] animate-pulse' : 'bg-[#B8892B]'}`}
            style={{ width: `${udhaarPercent}%` }}
          />
        </div>

        {isUdhaarOverLimit && (
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-[#8B2E3C] font-semibold bg-[#8B2E3C]/10 p-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('udhaarWarning')}</span>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl border border-[#1F2A44]/10 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Clock className="w-5 h-5 text-[#B8892B]" />
            <h3 className="text-base font-serif font-bold text-[#1F2A44]">
              {t('recentActivity')}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-[#8B2E3C] hover:underline font-bold uppercase tracking-wider flex items-center space-x-1 rtl:space-x-reverse"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activityLogs.length === 0 ? (
          <p className="text-xs text-[#1F2A44]/50 py-4 text-center italic">
            {t('noRecords')}
          </p>
        ) : (
          <div className="space-y-3 divide-y divide-[#1F2A44]/10">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-tighter bg-[#1F2A44] text-amber-300">
                      {log.partnerRole || 'Partner'}
                    </span>
                    <span className="font-semibold text-[#1F2A44]">
                      {log.entityName}
                    </span>
                    <span className="text-[#1F2A44]/60 capitalize text-[11px]">
                      • {log.action}
                    </span>
                  </div>
                  <p className="text-[#1F2A44]/80 text-[11px]">
                    {log.details}
                  </p>
                </div>
                <span className="text-[10px] text-[#1F2A44]/50 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
