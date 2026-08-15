import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';
import { useLanguage } from '../i18n/LanguageContext';

interface BillImageUploaderProps {
  value?: string;
  onChange: (imageUrl?: string) => void;
  label?: string;
  onPreviewFullscreen?: (url: string) => void;
}

export const BillImageUploader: React.FC<BillImageUploaderProps> = ({
  value,
  onChange,
  label,
  onPreviewFullscreen
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleProcessFile = async (file: File) => {
    setErrorMessage('');
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('errInvalidImage') || 'Please select an image file (JPG, PNG, WEBP).');
      return;
    }

    setIsProcessing(true);
    try {
      // Compress to compact high-quality JPEG (< 180KB)
      const compressed = await compressImageFile(file, 1200, 0.78);
      onChange(compressed.dataUrl);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setErrorMessage(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 flex items-center space-x-1 rtl:space-x-reverse">
          <Camera className="w-3.5 h-3.5 text-amber-800" />
          <span>{label}</span>
          <span className="text-[10px] font-normal text-slate-500">({t('optional')})</span>
        </label>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        /* Preview Card */
        <div className="relative group bg-amber-50/70 border border-amber-900/20 rounded-xl p-2.5 flex items-center justify-between transition shadow-xs">
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div 
              onClick={() => onPreviewFullscreen ? onPreviewFullscreen(value) : null}
              className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 cursor-pointer shadow-xs group-hover:ring-2 group-hover:ring-[#8B2E3C] transition"
            >
              <img
                src={value}
                alt="Bill attachment"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1 rtl:space-x-reverse">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t('billPhotoAttached') || 'Bill Photo Attached'}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                {t('clickToZoom') || 'Click thumbnail to inspect'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 rtl:space-x-reverse shrink-0">
            {onPreviewFullscreen && (
              <button
                type="button"
                onClick={() => onPreviewFullscreen(value)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                title={t('viewBillPhoto') || 'View Full Photo'}
              >
                <Eye className="w-4 h-4 text-slate-700" />
              </button>
            )}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
              title={t('retakePhoto') || 'Retake / Replace'}
            >
              <Camera className="w-4 h-4 text-amber-800" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title={t('removePhoto') || 'Remove Photo'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center transition bg-white/70 ${
            isDragging 
              ? 'border-[#8B2E3C] bg-amber-50' 
              : 'border-slate-300 hover:border-amber-700/50'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse py-2 text-xs text-amber-900 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#8B2E3C]" />
              <span>{t('processingImage') || 'Compressing & attaching photo...'}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-left rtl:text-right">
                <div className="p-2 rounded-lg bg-amber-100/70 text-amber-900 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {t('attachBillPhoto') || 'Attach Bill / Slip Photo'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {t('uploadHint') || 'Camera snapshot or image file (JPG/PNG)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t('takePhoto') || 'Camera'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer border border-slate-200"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('chooseFile') || 'Gallery'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-red-600 font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
