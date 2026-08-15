import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  Landmark, 
  Scale, 
  PieChart, 
  Settings 
} from 'lucide-react';
import { NavTab } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface NavigationTabsProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: t('tabDashboard'), icon: LayoutDashboard },
    { id: 'stock', label: t('tabStock'), icon: Package },
    { id: 'sales', label: t('tabSales'), icon: ShoppingCart },
    { id: 'udhaar', label: t('tabUdhaar'), icon: CreditCard },
    { id: 'expenses', label: t('tabExpenses'), icon: Receipt },
    { id: 'capital', label: t('tabCapital'), icon: Landmark },
    { id: 'settle', label: t('tabSettle'), icon: Scale },
    { id: 'reports', label: t('tabReports'), icon: PieChart },
    { id: 'settings', label: t('tabSettings'), icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-[#1F2A44]/10 sticky top-[65px] z-20 shadow-xs overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex space-x-1 rtl:space-x-reverse min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 rtl:space-x-reverse px-5 py-3.5 text-xs sm:text-sm uppercase tracking-wide font-bold transition cursor-pointer border-b-4 whitespace-nowrap ${
                isActive
                  ? 'border-[#8B2E3C] text-[#8B2E3C]'
                  : 'border-transparent text-[#1F2A44]/60 hover:text-[#1F2A44] hover:bg-[#F6F1E4]/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#8B2E3C]' : 'text-[#1F2A44]/40'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
