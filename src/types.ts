export type PartnerId = 'p1' | 'p2' | 'p3';

export interface PartnerConfig {
  id: PartnerId;
  name: string;
  role: string;
  sharePercent: number;
}

export type PaymentType = 'cash' | 'credit';

export type ExpenseCategory = 
  | 'Shop rent'
  | 'Electricity'
  | 'Transport / Loader'
  | 'Staff wages'
  | 'Damaged stock'
  | 'Tax'
  | 'Other';

export interface StockItem {
  id: string;
  name: string;
  unit: string; // e.g. kg, liter, dozen, packet, bag, pcs, box, bottle
  quantity: number;
  purchasePrice: number; // cost per unit
  date: string; // YYYY-MM-DD
  billImageUrl?: string; // photo / receipt image of the purchase bill
  updatedAt: number; // timestamp
  createdByRole: string; // Partner Name
}

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  purchasePrice: number; // snapshot cost per unit for profit calculations
  salePrice: number;
  totalSaleAmount: number;
  paymentType: PaymentType;
  shopkeeperName?: string; // customer name
  date: string; // ISO string YYYY-MM-DD
  invoiceNo?: string;
  billImageUrl?: string; // photo / slip image of the customer sale bill
  createdAt: number;
  createdByRole: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  details?: string; // required if category === 'Other'
  date: string;
  createdAt: number;
  createdByRole: string;
}

export interface UdhaarPayment {
  id: string;
  shopkeeperName: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: number;
  createdByRole: string;
}

export interface CapitalContribution {
  id: string;
  contributorName: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: number;
  createdByRole: string;
}

export interface PartnerShareSnapshot {
  partnerId: PartnerId;
  partnerName: string;
  percent: number;
  amount: number;
}

export type SettlementFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface Settlement {
  id: string;
  periodStart: number;
  periodEnd: number;
  totalSales: number;
  totalCOGS: number;
  totalExpenses: number;
  netProfit: number;
  settlementFrequency?: SettlementFrequency;
  shares: PartnerShareSnapshot[];
  partnerShares?: { partnerId: string; partnerName: string; sharePercent: number; amount: number }[];
  partner1Share?: number;
  partner2Share?: number;
  partner3Share?: number;
  settledAt: number;
  settledByRole: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  action: 'create' | 'edit' | 'delete' | 'settle';
  entityType: 'stock' | 'sale' | 'expense' | 'udhaar' | 'capital' | 'settlement';
  entityName: string;
  details: string;
  oldValues?: string;
  newValues?: string;
  partnerRole: string;
  timestamp: number;
}

export interface ShopSettings {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  invoiceFooterNote?: string;
  settlementFrequency: SettlementFrequency;
  partners: PartnerConfig[];
  shopCode?: string;
}

export type NavTab = 
  | 'dashboard'
  | 'stock'
  | 'sales'
  | 'udhaar'
  | 'expenses'
  | 'capital'
  | 'settle'
  | 'reports'
  | 'settings';

export type Language = 'en' | 'ur';

export interface ShopkeeperSummary {
  name: string;
  totalCreditSales: number;
  totalPayments: number;
  netBalanceDue: number;
  lastTransactionDate: string;
  transactionCount: number;
}

export interface DeletedItemUndoState {
  item: StockItem | Sale | Expense | UdhaarPayment | CapitalContribution;
  entityType: 'stock' | 'sale' | 'expense' | 'udhaar' | 'capital';
  stockRestoration?: { itemId: string; quantityToRestore: number };
}

export interface InvoiceBill {
  invoiceNo: string;
  date: string;
  shopkeeperName: string;
  paymentType: PaymentType;
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  createdBy: string;
  previousBalance?: number;
  currentBalance?: number;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
  footerNote?: string;
}
