import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  StockItem, 
  Sale, 
  Expense, 
  UdhaarPayment, 
  CapitalContribution, 
  Settlement, 
  ShopkeeperSummary, 
  ShopSettings,
  InvoiceBill
} from '../types';

export interface ReportDateFilter {
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
}

// 1. COMPREHENSIVE EXCEL WORKBOOK EXPORT
export const exportLedgerToExcel = (
  shopSettings: ShopSettings,
  shopCode: string,
  stockItems: StockItem[],
  sales: Sale[],
  expenses: Expense[],
  udhaarPayments: UdhaarPayment[],
  capitalContributions: CapitalContribution[],
  settlements: Settlement[],
  shopkeepers: ShopkeeperSummary[],
  filter?: ReportDateFilter
) => {
  const wb = XLSX.utils.book_new();

  const isWithinDate = (dateStr: string) => {
    if (!filter?.startDate && !filter?.endDate) return true;
    if (filter?.startDate && dateStr < filter.startDate) return false;
    if (filter?.endDate && dateStr > filter.endDate) return false;
    return true;
  };

  // Filtered lists
  const filteredSales = sales.filter(s => isWithinDate(s.date));
  const filteredExpenses = expenses.filter(e => isWithinDate(e.date));
  const filteredUdhaar = udhaarPayments.filter(u => isWithinDate(u.date));
  const filteredCapital = capitalContributions.filter(c => isWithinDate(c.date));

  // Summary Metrics
  const totalSalesAmt = filteredSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalGrossProfit = totalSalesAmt - totalCOGS;
  const totalExpAmt = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpAmt;
  const totalStockValue = stockItems.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);
  const totalOutstandingCredit = shopkeepers.reduce((sum, sk) => sum + Math.max(0, sk.netBalanceDue), 0);
  const totalCapital = capitalContributions.reduce((sum, c) => sum + c.amount, 0);

  const summaryData = [
    ['MUNSHI SHOP LEDGER REPORT', ''],
    ['Shop Name', shopSettings.shopName || 'Munshi Kiryana'],
    ['Shop Code', shopCode],
    ['Period', filter?.periodLabel || 'All Time Record'],
    ['Date Range', `${filter?.startDate || 'Earliest'} to ${filter?.endDate || 'Latest'}`],
    ['Generated On', new Date().toLocaleString()],
    ['', ''],
    ['KEY FINANCIAL METRICS', 'AMOUNT (PKR)'],
    ['Total Sales Turnover', totalSalesAmt],
    ['Cost of Goods Sold (COGS)', totalCOGS],
    ['Gross Profit', totalGrossProfit],
    ['Total Expenses', totalExpAmt],
    ['Net Profit / Loss', netProfit],
    ['Current Inventory Value', totalStockValue],
    ['Total Outstanding Udhaar', totalOutstandingCredit],
    ['Total Capital Contributed', totalCapital],
    ['', ''],
    ['PARTNER PROFIT DISTRIBUTION RATIO', ''],
    ...shopSettings.partners.map(p => [
      `${p.name} (${p.role}) - ${p.sharePercent}%`,
      netProfit > 0 ? (netProfit * p.sharePercent) / 100 : (netProfit * p.sharePercent) / 100
    ])
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sales sheet
  const salesRows = filteredSales.map((s, idx) => ({
    'Sr #': idx + 1,
    'Date': s.date,
    'Item Name': s.itemName,
    'Quantity': s.quantity,
    'Unit': s.unit,
    'Unit Cost (PKR)': s.purchasePrice,
    'Unit Sale Price (PKR)': s.salePrice,
    'Total Sale Amount (PKR)': s.totalSaleAmount,
    'Gross Profit (PKR)': s.totalSaleAmount - (s.quantity * s.purchasePrice),
    'Payment Type': s.paymentType.toUpperCase(),
    'Customer / Shopkeeper': s.shopkeeperName || 'Walk-in Cash',
    'Recorded By': s.createdByRole
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

  // Stock sheet
  const stockRows = stockItems.map((item, idx) => ({
    'Sr #': idx + 1,
    'Item Name': item.name,
    'Current Stock': item.quantity,
    'Unit': item.unit,
    'Purchase Cost (PKR)': item.purchasePrice,
    'Total Value (PKR)': item.quantity * item.purchasePrice,
    'Added Date': item.date || '-',
    'Logged By': item.createdByRole
  }));
  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock');

  // Udhaar sheet
  const udhaarRows = shopkeepers.map((sk, idx) => ({
    'Sr #': idx + 1,
    'Customer / Shopkeeper': sk.name,
    'Total Credit Given (PKR)': sk.totalCreditSales,
    'Total Payments Received (PKR)': sk.totalPayments,
    'Net Balance Due (PKR)': sk.netBalanceDue,
    'Last Transaction Date': sk.lastTransactionDate,
    'Status': sk.netBalanceDue > 0 ? 'Payment Pending' : 'Clear'
  }));
  const wsUdhaar = XLSX.utils.json_to_sheet(udhaarRows);
  XLSX.utils.book_append_sheet(wb, wsUdhaar, 'Udhaar Balances');

  // Expenses sheet
  const expenseRows = filteredExpenses.map((exp, idx) => ({
    'Sr #': idx + 1,
    'Date': exp.date,
    'Category': exp.category,
    'Details': exp.details || '',
    'Amount (PKR)': exp.amount,
    'Notes': exp.note || '',
    'Recorded By': exp.createdByRole
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // Capital sheet
  const capitalRows = filteredCapital.map((cap, idx) => ({
    'Sr #': idx + 1,
    'Date': cap.date,
    'Contributor Name': cap.contributorName,
    'Amount (PKR)': cap.amount,
    'Notes / Method': cap.note || '',
    'Recorded By': cap.createdByRole
  }));
  const wsCapital = XLSX.utils.json_to_sheet(capitalRows);
  XLSX.utils.book_append_sheet(wb, wsCapital, 'Capital');

  // Settlements sheet
  const settleRows = settlements.map((set, idx) => {
    const rowObj: Record<string, any> = {
      'Settlement #': idx + 1,
      'Settled Date': new Date(set.settledAt).toLocaleDateString(),
      'Total Sales (PKR)': set.totalSales,
      'Total COGS (PKR)': set.totalCOGS,
      'Total Expenses (PKR)': set.totalExpenses,
      'Net Profit (PKR)': set.netProfit,
      'Settled By': set.settledByRole,
      'Notes': set.note || ''
    };
    if (set.shares && set.shares.length > 0) {
      set.shares.forEach(sh => {
        rowObj[`${sh.partnerName} (${sh.percent}%)`] = sh.amount;
      });
    }
    return rowObj;
  });
  if (settleRows.length > 0) {
    const wsSettle = XLSX.utils.json_to_sheet(settleRows);
    XLSX.utils.book_append_sheet(wb, wsSettle, 'Settlements');
  }

  const dateTag = new Date().toISOString().split('T')[0];
  const cleanShop = (shopSettings.shopName || 'Munshi').replace(/\s+/g, '_');
  const filename = `${cleanShop}_Report_${dateTag}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// 2. QUICK PERIOD SHOP REPORT EXCEL
export const exportShopReportToExcel = (params: {
  sales: Sale[];
  expenses: Expense[];
  stockItems: StockItem[];
  udhaarPayments?: UdhaarPayment[];
  reportTitle: string;
}) => {
  const wb = XLSX.utils.book_new();

  // Sales sheet
  const salesRows = params.sales.map((s, idx) => ({
    'Sr #': idx + 1,
    'Date': s.date,
    'Item Name': s.itemName,
    'Quantity': s.quantity,
    'Unit': s.unit,
    'Cost Price (PKR)': s.purchasePrice,
    'Sale Price (PKR)': s.salePrice,
    'Total Amount (PKR)': s.totalSaleAmount,
    'Gross Profit (PKR)': s.totalSaleAmount - (s.quantity * s.purchasePrice),
    'Payment Type': s.paymentType.toUpperCase(),
    'Customer': s.shopkeeperName || 'Walk-in Cash',
    'Recorded By': s.createdByRole
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

  // Expenses sheet
  const expenseRows = params.expenses.map((e, idx) => ({
    'Sr #': idx + 1,
    'Date': e.date,
    'Category': e.category,
    'Amount (PKR)': e.amount,
    'Details / Notes': e.details || e.note || '',
    'Recorded By': e.createdByRole
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // Stock sheet
  const stockRows = params.stockItems.map((item, idx) => ({
    'Sr #': idx + 1,
    'Item Name': item.name,
    'Quantity': item.quantity,
    'Unit': item.unit,
    'Cost Price (PKR)': item.purchasePrice,
    'Total Value (PKR)': item.quantity * item.purchasePrice,
    'Date Added': item.date || ''
  }));
  const wsStock = XLSX.utils.json_to_sheet(stockRows);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock Inventory');

  const cleanTitle = params.reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `${cleanTitle}.xlsx`);
};

// 3. PERIOD PROFIT PDF REPORT
export const exportProfitReportToPDF = (data: {
  reportTitle: string;
  period: string;
  totalSales: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  partnerShares: { name: string; sharePercent: number; amount: number }[];
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(31, 42, 68); // #1F2A44 Navy
  doc.rect(0, 0, doc.internal.pageSize.width, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Munshi Ledger - Financial Profit Statement', 40, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${data.period} | Generated: ${new Date().toLocaleDateString()}`, 40, 48);

  let curY = 85;

  // Summary Metrics Table
  doc.setTextColor(31, 42, 68);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary Breakdown', 40, curY);
  curY += 8;

  const metrics = [
    ['Total Sales Revenue', `Rs. ${data.totalSales.toLocaleString()}`],
    ['Cost of Goods Sold (COGS)', `Rs. ${data.cogs.toLocaleString()}`],
    ['Gross Trading Profit', `Rs. ${data.grossProfit.toLocaleString()}`],
    ['Total Operating Expenses', `Rs. ${data.expenses.toLocaleString()}`],
    ['Net Profit / (Loss)', `Rs. ${data.netProfit.toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Metric', 'Amount (PKR)']],
    body: metrics,
    theme: 'grid',
    headStyles: { fillColor: [139, 46, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 320 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 190 }
    },
    margin: { left: 40, right: 40 }
  });

  curY = (doc as any).lastAutoTable.finalY + 25;

  // Partner Distribution Table
  doc.text('Partner Profit Distribution Breakdown', 40, curY);
  curY += 8;

  const partnerRows = data.partnerShares.map(p => [
    p.name,
    `${p.sharePercent}%`,
    `Rs. ${Math.round(p.amount).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Partner Name', 'Profit Ratio %', 'Calculated Share (PKR)']],
    body: partnerRows,
    theme: 'striped',
    headStyles: { fillColor: [31, 42, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  const dateTag = new Date().toISOString().split('T')[0];
  doc.save(`Munshi_Profit_Report_${dateTag}.pdf`);
};

// 4. SETTLEMENT STATEMENT PDF
export const exportSettlementStatementToPDF = (settlement: Settlement, shopName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  doc.setFillColor(31, 42, 68);
  doc.rect(0, 0, doc.internal.pageSize.width, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${shopName || 'Munshi'} - Settlement Statement`, 40, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Settled on: ${new Date(settlement.settledAt).toLocaleString()} by ${settlement.settledByRole}`, 40, 48);

  let curY = 85;

  const summary = [
    ['Total Sales in Settlement Period', `Rs. ${settlement.totalSales.toLocaleString()}`],
    ['Cost of Goods Sold (COGS)', `Rs. ${settlement.totalCOGS.toLocaleString()}`],
    ['Total Operating Expenses', `Rs. ${settlement.totalExpenses.toLocaleString()}`],
    ['Net Profit Distributed', `Rs. ${settlement.netProfit.toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: curY,
    head: [['Settlement Item', 'Amount (PKR)']],
    body: summary,
    theme: 'grid',
    headStyles: { fillColor: [139, 46, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 320 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 190 }
    },
    margin: { left: 40, right: 40 }
  });

  curY = (doc as any).lastAutoTable.finalY + 20;

  // Partner Shares
  doc.setTextColor(31, 42, 68);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Partner Payout Distribution', 40, curY);
  curY += 8;

  const sharesList = settlement.shares || settlement.partnerShares || [];
  const sharesRows = sharesList.map((s: any) => [
    s.partnerName || s.name,
    `${s.percent || s.sharePercent}%`,
    `Rs. ${Math.round(s.amount).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: curY,
    head: [['Partner', 'Agreed Ratio', 'Payout Amount (PKR)']],
    body: sharesRows,
    theme: 'striped',
    headStyles: { fillColor: [31, 42, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      2: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  doc.save(`Settlement_${new Date(settlement.settledAt).toISOString().split('T')[0]}.pdf`);
};

// 5. INVOICE BILL GENERATOR
export const exportInvoiceBillToPDF = (
  shopSettings: ShopSettings,
  shopCode: string,
  invoice: InvoiceBill | any
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [320, 520]
  });

  doc.setFillColor(31, 42, 68);
  doc.rect(0, 0, 320, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(invoice.shopName || shopSettings.shopName || 'Munshi Kiryana', 160, 24, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.shopAddress || shopSettings.shopAddress || `Shop Code: ${shopCode} | Tel: ${invoice.shopPhone || shopSettings.shopPhone || 'N/A'}`, 160, 38, { align: 'center' });

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE: ${invoice.invoiceNo}`, 15, 68);
  doc.text(`Date: ${invoice.date}`, 305, 68, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${invoice.shopkeeperName || invoice.customerName || 'Walk-in Customer'}`, 15, 82);
  doc.text(`Type: ${(invoice.paymentType || 'CASH').toUpperCase()}`, 305, 82, { align: 'right' });
  doc.text(`Sold By: ${invoice.createdBy || invoice.soldBy || 'Partner'}`, 15, 95);

  const itemsList = invoice.items || [];
  const tableData = itemsList.map((item: any) => [
    item.itemName || item.name,
    `${item.quantity} ${item.unit}`,
    `Rs. ${item.unitPrice || item.price || item.salePrice}`,
    `Rs. ${(item.total || item.totalPrice || item.quantity * (item.unitPrice || item.salePrice)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 105,
    head: [['Item', 'Qty', 'Rate', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [139, 46, 60], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
      3: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bill Total:', 180, finalY);
  doc.text(`Rs. ${(invoice.totalAmount || 0).toLocaleString()}`, 305, finalY, { align: 'right' });

  let extraY = finalY;
  if (invoice.currentBalance !== undefined && (invoice.paymentType || '').toLowerCase() === 'credit') {
    extraY += 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Total Udhaar Due:', 140, extraY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 40, 40);
    doc.text(`Rs. ${invoice.currentBalance.toLocaleString()}`, 305, extraY, { align: 'right' });
  }

  extraY += 24;
  doc.setTextColor(90, 90, 90);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(invoice.footerNote || shopSettings.invoiceFooterNote || 'Thank you for your business! Please visit again.', 160, extraY, { align: 'center' });

  doc.save(`Bill_${invoice.invoiceNo}.pdf`);
};
