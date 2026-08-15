import React, { useState } from 'react';
import { Store, PlusCircle, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthRole } from '../context/AuthRoleContext';
import { useLanguage } from '../i18n/LanguageContext';

export const ShopSetupModal: React.FC = () => {
  const { setShopCode } = useAuthRole();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateShopCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateShop = () => {
    setIsSubmitting(true);
    const newCode = generateShopCode();
    setTimeout(() => {
      setShopCode(newCode);
      setIsSubmitting(false);
    }, 400);
  };

  const handleJoinShop = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (clean.length !== 6) {
      setError(t('joinError'));
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setShopCode(clean);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2A44]/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#F6F1E4] border border-[#B8892B]/50 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#1F2A44] rounded-2xl text-amber-300 shadow-md border border-amber-400/30">
            <Store className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">
            {t('setupTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            {t('setupSubtitle')}
          </p>
        </div>

        {mode === 'choose' ? (
          <div className="space-y-4 pt-2">
            {/* Create New Shop Button */}
            <button
              onClick={handleCreateShop}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-4 bg-[#8B2E3C] hover:bg-[#732330] text-white rounded-xl shadow-md transition group cursor-pointer border border-amber-500/20"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-white/10 rounded-lg text-amber-300">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="text-left rtl:text-right">
                  <div className="text-sm font-bold">{t('createShopBtn')}</div>
                  <div className="text-xs text-amber-200/80">Generates a unique 6-character shop code</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
            </button>

            {/* Join Existing Shop Button */}
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-between p-4 bg-[#1F2A44] hover:bg-[#161f33] text-white rounded-xl shadow-md transition group cursor-pointer border border-amber-400/30"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="p-2 bg-white/10 rounded-lg text-amber-300">
                  <LogIn className="w-6 h-6" />
                </div>
                <div className="text-left rtl:text-right">
                  <div className="text-sm font-bold">{t('joinShopBtn')}</div>
                  <div className="text-xs text-slate-300">Enter code shared by partner</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoinShop} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t('enterShopCodePrompt')}
              </label>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder={t('shopCodePlaceholder')}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-center text-2xl font-mono tracking-widest font-bold text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:border-transparent focus:outline-none uppercase"
                autoFocus
              />
              {error && (
                <p className="mt-1 text-xs text-red-600 font-medium text-center">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-1/3 py-3 bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-300 transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || inputCode.trim().length !== 6}
                className="w-2/3 py-3 bg-[#8B2E3C] hover:bg-[#732330] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? t('joiningShop') : t('joinShopBtn')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
