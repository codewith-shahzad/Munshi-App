import React, { useState } from 'react';
import { 
  Store, 
  Copy, 
  Check, 
  Globe, 
  UserCheck, 
  Wifi, 
  WifiOff, 
  Lock, 
  Settings as SettingsIcon,
  Users
} from 'lucide-react';
import { useAuthRole } from '../context/AuthRoleContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useShop } from '../context/ShopContext';
import { PartnerId } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { partnerId, setPartnerId, shopCode, pinSettings, lockApp } = useAuthRole();
  const { language, toggleLanguage, t } = useLanguage();
  const { isOnline, settings } = useShop();

  const [copied, setCopied] = useState(false);

  const handleCopyShopCode = () => {
    if (!shopCode) return;
    navigator.clipboard.writeText(shopCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const partners = settings?.partners || [
    { id: 'p1', name: 'Partner 1', role: 'Partner 1', sharePercent: 33.34 },
    { id: 'p2', name: 'Partner 2', role: 'Partner 2', sharePercent: 33.33 },
    { id: 'p3', name: 'Partner 3', role: 'Partner 3', sharePercent: 33.33 },
  ];

  return (
    <header className="bg-[#1F2A44] text-white shadow-lg border-b border-[#B8892B]/30 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Shop Code */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 bg-[#8B2E3C] rounded-xl text-[#B8892B] shadow-md border border-white/10 shrink-0">
            <Store className="w-6 h-6 text-[#B8892B]" />
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#B8892B]">
                {settings?.shopName || t('appName')}
              </h1>
              {shopCode && (
                <button
                  type="button"
                  onClick={handleCopyShopCode}
                  title={t('copyShopCode')}
                  className="cursor-pointer bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-widest border border-white/20 text-[#B8892B] font-bold flex items-center gap-1.5 hover:bg-white/20 transition"
                >
                  <span>{t('shopCodeLabel')}: <span className="text-white">{shopCode}</span></span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 hidden sm:block font-medium mt-0.5">
              {t('appSubTitle')}
            </p>
          </div>
        </div>

        {/* Sync Status & 3-Partner Switcher & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* Online/Offline Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 font-mono text-[11px]">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="hidden md:inline font-sans">{t('online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline font-sans">{t('offline')}</span>
              </>
            )}
          </div>

          {/* 3-Partner Switcher */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/15">
            <Users className="w-3.5 h-3.5 text-[#B8892B] ml-1.5 shrink-0 hidden sm:inline" />
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value as PartnerId)}
              className="bg-[#8B2E3C] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-amber-400/30 focus:ring-2 ring-[#B8892B] cursor-pointer"
            >
              {partners.map(p => (
                <option key={p.id} value={p.id} className="bg-[#1F2A44] text-white">
                  {p.name} ({p.sharePercent}%)
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle Pill */}
          <div className="flex bg-white/10 rounded-full p-1 border border-white/20">
            <button
              onClick={toggleLanguage}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                language === 'en' ? 'bg-[#B8892B] text-white shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={toggleLanguage}
              className={`px-2.5 py-1 rounded-full text-xs font-serif transition cursor-pointer ${
                language === 'ur' ? 'bg-[#B8892B] text-white shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>

          {/* Lock App if PIN set */}
          {pinSettings.enabled && (
            <button
              onClick={lockApp}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition cursor-pointer"
              title={t('pinLocked')}
            >
              <Lock className="w-4 h-4 text-[#B8892B]" />
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition cursor-pointer"
            title={t('tabSettings')}
          >
            <SettingsIcon className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>
    </header>
  );
};
