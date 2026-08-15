import React, { useState } from 'react';
import { X, Printer, Download, Receipt, Store, Calendar, User, Eye, Image as ImageIcon } from 'lucide-react';
import { InvoiceBill, Sale, ShopSettings } from '../types';
import { exportInvoiceBillToPDF } from '../utils/exportUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { BillPhotoModal } from './BillPhotoModal';

interface BillModalProps {
  isOpen: boolean;
  sale: Sale | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  sale,
  settings,
  onClose
}) => {
  const { t } = useLanguage();
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  if (!isOpen || !sale) return null;

  const invoiceBill: InvoiceBill = {
    invoiceNo: sale.invoiceNo || `INV-${sale.id.slice(-6).toUpperCase()}`,
    shopName: settings.shopName || 'Munshi Kiryana & General Store',
    shopPhone: settings.shopPhone || '',
    shopAddress: settings.shopAddress || '',
    shopkeeperName: sale.shopkeeperName || 'Walk-in Customer',
    date: sale.date,
    items: [
      {
        itemName: sale.itemName,
        quantity: sale.quantity,
        unit: sale.unit,
        unitPrice: sale.salePrice,
        total: sale.totalSaleAmount
      }
    ],
    totalAmount: sale.totalSaleAmount,
    paymentType: sale.paymentType,
    createdBy: sale.createdByRole,
    footerNote: settings.invoiceFooterNote || 'Thank you for your business!'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    exportInvoiceBillToPDF(settings, settings.shopCode || '', invoiceBill);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
        <div className="bg-white border border-[#B8892B]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 my-8">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Receipt className="w-5 h-5 text-[#8B2E3C]" />
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Customer Bill / Invoice
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Thermal Receipt Card */}
          <div id="printable-bill" className="bg-[#FAF8F5] border border-dashed border-amber-900/30 rounded-xl p-5 text-slate-900 font-mono text-xs space-y-4 shadow-inner">
            {/* Shop branding */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h2 className="font-serif font-bold text-base text-[#1F2A44] tracking-tight">
                {invoiceBill.shopName}
              </h2>
              {invoiceBill.shopPhone && (
                <p className="text-[11px] text-slate-600">Ph: {invoiceBill.shopPhone}</p>
              )}
              {invoiceBill.shopAddress && (
                <p className="text-[10px] text-slate-500">{invoiceBill.shopAddress}</p>
              )}
              <div className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                {invoiceBill.invoiceNo}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <strong className="text-slate-900">{invoiceBill.shopkeeperName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{invoiceBill.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className={`font-bold uppercase ${invoiceBill.paymentType === 'cash' ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {invoiceBill.paymentType === 'cash' ? 'Paid (Cash)' : 'Udhaar (Credit)'}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700 text-[11px] border-b border-slate-200 pb-1">
                <span>Item Description</span>
                <span>Total (PKR)</span>
              </div>
              {invoiceBill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <div>
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                    <div className="text-[10px] text-slate-500">
                      {item.quantity} {item.unit} × Rs. {item.unitPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 self-center">
                    Rs. {item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-bold">
              <span className="font-serif">NET TOTAL:</span>
              <span className="font-mono text-base text-[#8B2E3C]">
                Rs. {invoiceBill.totalAmount.toLocaleString()}
              </span>
            </div>

            {/* Attached Photo indicator if present on print card */}
            {sale.billImageUrl && (
              <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-sans flex items-center space-x-1 rtl:space-x-reverse">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                  <span>Attached Bill Photo Available</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded flex items-center space-x-1 rtl:space-x-reverse transition cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Slip</span>
                </button>
              </div>
            )}

            {/* Footer note */}
            <div className="text-center text-[10px] text-slate-500 italic pt-1 border-t border-dashed border-slate-300">
              {invoiceBill.footerNote}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-4 py-2.5 bg-[#1F2A44] hover:bg-[#161f33] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#B8892B]" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-4 py-2.5 bg-[#8B2E3C] hover:bg-[#72232f] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill Photo Lightbox */}
      {sale.billImageUrl && (
        <BillPhotoModal
          isOpen={showPhotoModal}
          imageUrl={sale.billImageUrl}
          title={`Bill Slip - ${sale.itemName}`}
          subtitle={`${sale.quantity} ${sale.unit} @ Rs. ${sale.salePrice} (${invoiceBill.invoiceNo})`}
          metaInfo={[
            { label: 'Invoice', value: invoiceBill.invoiceNo },
            { label: 'Customer', value: invoiceBill.shopkeeperName },
            { label: 'Date', value: invoiceBill.date },
            { label: 'Amount', value: `Rs. ${invoiceBill.totalAmount.toLocaleString()}` }
          ]}
          onClose={() => setShowPhotoModal(false)}
        />
      )}
    </>
  );
};
