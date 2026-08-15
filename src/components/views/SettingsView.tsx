import React, { useState, useRef } from 'react';
import { Settings, Users, Percent, Calendar, Store, Save, Download, Upload, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Phone, MapPin, FileText } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShopSettings, SettlementFrequency } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateShopSettings, backupAllData, restoreFromBackup, isOnline } = useShop();
  const { t } = useLanguage();

  const [formSettings, setFormSettings] = useState<ShopSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total percentage share
  const totalPercent = formSettings.partners.reduce((sum, p) => sum + (Number(p.sharePercent) || 0), 0);
  const isPercentValid = Math.abs(totalPercent - 100) < 0.01;

  const handlePartnerChange = (index: number, field: 'name' | 'sharePercent', value: string | number) => {
    const updated = [...formSettings.partners];
    if (field === 'sharePercent') {
      updated[index] = { ...updated[index], sharePercent: parseFloat(value.toString()) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormSettings({ ...formSettings, partners: updated });
    setSaveSuccess(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);

    if (!isPercentValid) {
      setErrorMessage(`Total profit percentage must sum exactly to 100%. Current total: ${totalPercent}%`);
      return;
    }

    try {
      await updateShopSettings(formSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = backupAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Munshi_Backup_${settings.shopCode}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const result = await restoreFromBackup(content);
        if (result.success) {
          setRestoreStatus('All records and settings successfully restored!');
        } else {
          setErrorMessage(result.error || 'Failed to restore backup file');
        }
      } catch (err: any) {
        setErrorMessage('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-slate-900">
          {t('settingsTitle')}
        </h2>
        <p className="text-xs text-slate-600">
          Customize 3-partner profit ratios, settlement cycles, bill headers, and backup database
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Profit Distribution Ratios */}
        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <Users className="w-5 h-5 text-[#8B2E3C]" />
              <h3 className="text-base font-serif font-bold text-slate-900">
                Partner Names & Profit Sharing Percentage
              </h3>
            </div>

            <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${isPercentValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              Total: {totalPercent}% / 100%
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Set custom names and ratio percentages for the 3 active business partners. Ratios automatically determine profit payouts across all reports and settlements.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formSettings.partners.map((partner, index) => (
              <div key={partner.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Partner #{index + 1} ({partner.id.toUpperCase()})</span>
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={partner.name}
                    onChange={(e) => handlePartnerChange(index, 'name', e.target.value)}
                    placeholder={`Partner ${index + 1}`}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Share Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    required
                    value={partner.sharePercent}
                    onChange={(e) => handlePartnerChange(index, 'sharePercent', e.target.value)}
                    placeholder="e.g. 33.33"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
                  />
                </div>
              </div>
            ))}
          </div>

          {!isPercentValid && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center space-x-2 rtl:space-x-reverse">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Percentages must sum to exactly 100%. Current total is {totalPercent}%.</span>
            </div>
          )}
        </div>

        {/* 2. Settlement Frequency */}
        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-amber-800" />
            <h3 className="text-base font-serif font-bold text-slate-900">
              Settlement Cycle Frequency
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['weekly', 'fortnightly', 'monthly'] as SettlementFrequency[]).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFormSettings({ ...formSettings, settlementFrequency: freq })}
                className={`p-4 rounded-xl border text-left rtl:text-right transition cursor-pointer ${
                  formSettings.settlementFrequency === freq
                    ? 'bg-[#1F2A44] text-white border-[#1F2A44] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs uppercase tracking-wider mb-1">
                  {freq === 'weekly' ? 'Weekly (7 Days)' : freq === 'fortnightly' ? 'Fortnightly (15 Days)' : 'Monthly'}
                </div>
                <p className={`text-[11px] ${formSettings.settlementFrequency === freq ? 'text-amber-200' : 'text-slate-500'}`}>
                  {freq === 'weekly' ? 'Settle & pay out profit every 7 days' : freq === 'fortnightly' ? 'Settle & distribute every 15 days' : 'Standard monthly account settlement'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Shop & Bill / Invoice Branding */}
        <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-amber-800" />
            <h3 className="text-base font-serif font-bold text-slate-900">
              Shop Information & Customer Invoices / Bills
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={formSettings.shopName}
                onChange={(e) => setFormSettings({ ...formSettings, shopName: e.target.value })}
                placeholder="e.g. Al-Madina Kiryana & General Store"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={formSettings.shopPhone || ''}
                onChange={(e) => setFormSettings({ ...formSettings, shopPhone: e.target.value })}
                placeholder="e.g. +92 300 1234567"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Address / Location
              </label>
              <input
                type="text"
                value={formSettings.shopAddress || ''}
                onChange={(e) => setFormSettings({ ...formSettings, shopAddress: e.target.value })}
                placeholder="e.g. Main Bazar, Shop #12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Footer Note
              </label>
              <input
                type="text"
                value={formSettings.invoiceFooterNote || ''}
                onChange={(e) => setFormSettings({ ...formSettings, invoiceFooterNote: e.target.value })}
                placeholder="e.g. Thank you for your business!"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B2E3C]"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-100 text-red-700 text-xs font-bold rounded-xl flex items-center space-x-2 rtl:space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Settings saved successfully and synced across all devices!</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* 4. Complete Data Backup & Loss Protection */}
      <div className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Safe Backup & Restore (Loss of Phone / Deletion Protection)
            </h3>
            <p className="text-xs text-slate-500">
              Safely export full snapshot of stock, sales, udhaar, and capital records to your device or Google Drive
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">1-Click JSON Backup File</h4>
              <p className="text-[11px] text-slate-500">
                Downloads complete data backup file containing all products, sales history, udhaar records, and partner ratios.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-[#1F2A44] hover:bg-[#161f33] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Restore from Backup File</h4>
              <p className="text-[11px] text-slate-500">
                Restore full store data on a new phone or after app reset by choosing your backup JSON file.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-300" />
              <span>Restore from File</span>
            </button>
          </div>
        </div>

        {restoreStatus && (
          <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{restoreStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
