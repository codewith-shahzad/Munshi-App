import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthRole } from '../context/AuthRoleContext';
import { useLanguage } from '../i18n/LanguageContext';

export const PinLockModal: React.FC = () => {
  const { unlockWithPin, resetPinWithPhrase, isLocked } = useAuthRole();
  const { t } = useLanguage();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [newPin, setNewPin] = useState('');

  if (!isLocked) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockWithPin(pin)) {
      setPin('');
      setError('');
    } else {
      setError(t('incorrectPin'));
      setPin('');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length !== 4) {
      setError(t('setPinPrompt'));
      return;
    }
    if (resetPinWithPhrase(secretPhrase, newPin)) {
      setSecretPhrase('');
      setNewPin('');
      setError('');
      setShowRecovery(false);
    } else {
      setError(t('secretPhraseError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2A44]/95 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#F6F1E4] border border-[#B8892B]/50 rounded-2xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#8B2E3C] rounded-full text-amber-300 shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">
            {t('pinLocked')}
          </h2>
          <p className="text-xs text-slate-600">
            {showRecovery ? t('recoveryPrompt') : t('enterPinPrompt')}
          </p>
        </div>

        {!showRecovery ? (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-center text-3xl font-mono tracking-widest font-bold text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-xs text-red-600 font-medium text-center flex items-center justify-center space-x-1 rtl:space-x-reverse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pin.length !== 4}
              className="w-full py-3 bg-[#8B2E3C] hover:bg-[#70232e] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
            >
              Unlock Munshi
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRecovery(true);
                setError('');
              }}
              className="w-full text-center text-xs text-amber-900 hover:underline font-medium pt-1"
            >
              {t('forgotPin')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('secretPhrasePlaceholder')}
              </label>
              <input
                type="text"
                value={secretPhrase}
                onChange={(e) => {
                  setSecretPhrase(e.target.value);
                  setError('');
                }}
                placeholder={t('secretPhrasePlaceholder')}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none mb-3"
              />

              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-center text-xl font-mono tracking-widest text-slate-900 focus:ring-2 focus:ring-[#8B2E3C] focus:outline-none"
              />

              {error && (
                <p className="mt-2 text-xs text-red-600 font-medium text-center">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setError('');
                }}
                className="w-1/3 py-2.5 bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-[#8B2E3C] text-white text-xs font-semibold rounded-lg hover:bg-[#70232e] shadow-md flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('resetPinBtn')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
