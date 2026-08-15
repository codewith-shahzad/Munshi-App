import React, { useState } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthRoleProvider, useAuthRole } from './context/AuthRoleContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { ShopSetupModal } from './components/ShopSetupModal';
import { PinLockModal } from './components/PinLockModal';
import { UndoToast } from './components/UndoToast';

// Views
import { DashboardView } from './components/views/DashboardView';
import { StockView } from './components/views/StockView';
import { SalesView } from './components/views/SalesView';
import { UdhaarView } from './components/views/UdhaarView';
import { ExpensesView } from './components/views/ExpensesView';
import { CapitalView } from './components/views/CapitalView';
import { SettlementView } from './components/views/SettlementView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

import { NavTab } from './types';

const MainAppContent: React.FC = () => {
  const { shopCode, isLocked } = useAuthRole();
  const { loading } = useShop();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (!shopCode) {
    return <ShopSetupModal />;
  }

  return (
    <div className="min-h-screen bg-[#F6F1E4] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <Header onOpenSettings={() => setActiveTab('settings')} />

      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
            <div className="w-8 h-8 border-3 border-[#8B2E3C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-600 font-medium">Syncing with Firestore...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'stock' && <StockView />}
            {activeTab === 'sales' && <SalesView />}
            {activeTab === 'udhaar' && <UdhaarView />}
            {activeTab === 'expenses' && <ExpensesView />}
            {activeTab === 'capital' && <CapitalView />}
            {activeTab === 'settle' && <SettlementView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* PIN Lock Overlay Modal if Locked */}
      {isLocked && <PinLockModal />}

      {/* Floating 6-second Undo Toast */}
      <UndoToast />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthRoleProvider>
        <ShopProvider>
          <MainAppContent />
        </ShopProvider>
      </AuthRoleProvider>
    </LanguageProvider>
  );
}
