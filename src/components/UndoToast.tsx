import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../i18n/LanguageContext';

export const UndoToast: React.FC = () => {
  const { undoState, undoLastDelete, clearUndoState } = useShop();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undoState) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / 60); // 6 seconds total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [undoState]);

  if (!undoState) return null;

  const getMessage = () => {
    switch (undoState.entityType) {
      case 'sale':
        return t('saleDeleted');
      case 'expense':
        return t('expenseDeleted');
      case 'udhaar':
        return t('udhaarDeleted');
      case 'capital':
        return t('capitalDeleted');
      default:
        return t('itemDeleted');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-[#1F2A44] text-white rounded-xl shadow-2xl border border-amber-400/40 p-4 overflow-hidden animate-bounceIn">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-slate-100">
            {getMessage()}
          </span>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={undoLastDelete}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-[#8B2E3C] hover:bg-[#70232e] text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('undo')}</span>
          </button>
          <button
            onClick={clearUndoState}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className="h-full bg-amber-400 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
