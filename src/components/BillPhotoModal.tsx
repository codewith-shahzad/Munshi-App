import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, RefreshCw, Receipt, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BillPhotoModalProps {
  isOpen: boolean;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  metaInfo?: { label: string; value: string }[];
  onClose: () => void;
}

export const BillPhotoModal: React.FC<BillPhotoModalProps> = ({
  isOpen,
  imageUrl,
  title,
  subtitle,
  metaInfo,
  onClose
}) => {
  const { t } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.6));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_bill.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#1F2A44] border border-amber-900/40 rounded-2xl max-w-2xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/80 bg-[#161f33] shrink-0">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-amber-200/80 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title={t('downloadPhoto') || 'Download Photo'}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Metadata Bar */}
        {metaInfo && metaInfo.length > 0 && (
          <div className="bg-slate-800/80 px-5 py-2 border-b border-slate-700/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 shrink-0 font-mono">
            {metaInfo.map((info, idx) => (
              <div key={idx} className="flex items-center space-x-1 rtl:space-x-reverse">
                <span className="text-slate-400 font-sans">{info.label}:</span>
                <strong className="text-amber-300">{info.value}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Image Display Area with Overflow Scroll */}
        <div className="relative flex-1 bg-slate-900/90 overflow-auto flex items-center justify-center p-4 min-h-[300px]">
          <div 
            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[62vh] max-w-full rounded-lg shadow-2xl object-contain border border-slate-700 bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="px-5 py-3 border-t border-slate-700/80 bg-[#161f33] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="hidden sm:inline">+</span>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="hidden sm:inline">-</span>
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">Rotate</span>
            </button>
            {(zoom !== 1 || rotation !== 0) && (
              <button
                type="button"
                onClick={handleReset}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse cursor-pointer"
                title="Reset Zoom & Orientation"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {Math.round(zoom * 100)}%
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            {t('cancel') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
