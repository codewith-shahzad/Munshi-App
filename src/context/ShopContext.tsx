import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback
} from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthRole } from './AuthRoleContext';
import { 
  StockItem, 
  Sale, 
  Expense, 
  UdhaarPayment, 
  CapitalContribution, 
  Settlement, 
  ActivityLog, 
  ShopkeeperSummary,
  ExpenseCategory,
  PaymentType,
  DeletedItemUndoState,
  ShopSettings
} from '../types';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'Munshi Kiryana & General Store',
  shopPhone: '',
  shopAddress: '',
  invoiceFooterNote: 'Thank you for your business!',
  settlementFrequency: 'weekly',
  partners: [
    { id: 'p1', name: 'Partner 1', role: 'Partner 1', sharePercent: 33.34 },
    { id: 'p2', name: 'Partner 2', role: 'Partner 2', sharePercent: 33.33 },
    { id: 'p3', name: 'Partner 3', role: 'Partner 3', sharePercent: 33.33 },
  ]
};

interface ShopContextType {
  // Real-time state collections
  stockItems: StockItem[];
  sales: Sale[];
  expenses: Expense[];
  udhaarPayments: UdhaarPayment[];
  capitalContributions: CapitalContribution[];
  settlements: Settlement[];
  activityLogs: ActivityLog[];
  settings: ShopSettings;
  
  // Status flags
  loading: boolean;
  isOnline: boolean;
  lastSynced: number | null;
  
  // Derived state & summaries
  shopkeepers: ShopkeeperSummary[];
  totalOutstandingUdhaar: number;
  totalCapitalRaised: number;
  lastSettlementTimestamp: number;
  unsettledSales: number;
  unsettledExpenses: number;
  unsettledProfit: number;
  activePartnerName: string;

  // Settings
  updateShopSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;

  // Actions - Stock
  addOrUpdateStock: (name: string, unit: string, quantity: number, purchasePrice: number, date?: string, billImageUrl?: string) => Promise<void>;
  editStock: (id: string, name: string, unit: string, quantity: number, purchasePrice: number, date?: string, billImageUrl?: string) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;

  // Actions - Sales
  addSale: (itemId: string, quantity: number, salePrice: number, paymentType: PaymentType, shopkeeperName?: string, date?: string, customInvoiceNo?: string, billImageUrl?: string) => Promise<void>;
  editSale: (saleId: string, newQuantity: number, newSalePrice: number, newPaymentType: PaymentType, newShopkeeperName?: string, newDate?: string, billImageUrl?: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;

  // Actions - Expenses
  addExpense: (category: ExpenseCategory, amount: number, note?: string, details?: string, date?: string) => Promise<void>;
  editExpense: (id: string, category: ExpenseCategory, amount: number, note?: string, details?: string, date?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Actions - Udhaar
  addUdhaarPayment: (shopkeeperName: string, amount: number, note?: string, date?: string) => Promise<void>;
  editUdhaarPayment: (id: string, shopkeeperName: string, amount: number, note?: string, date?: string) => Promise<void>;
  deleteUdhaarPayment: (id: string) => Promise<void>;

  // Actions - Capital
  addCapitalContribution: (contributorName: string, amount: number, note?: string, date?: string) => Promise<void>;
  editCapitalContribution: (id: string, contributorName: string, amount: number, note?: string, date?: string) => Promise<void>;
  deleteCapitalContribution: (id: string) => Promise<void>;

  // Actions - Settlement
  markAsSettled: (note?: string, customDateRange?: { start: number; end: number }) => Promise<void>;

  // Undo mechanism
  undoState: DeletedItemUndoState | null;
  undoLastDelete: () => Promise<void>;
  clearUndoState: () => void;

  // Backup and restore
  backupAllData: () => string;
  restoreFromBackup: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  exportBackupData: () => Promise<string>;
  restoreBackupData: (jsonString: string) => Promise<boolean>;
}

// Safe cleaner to guarantee no `undefined` value is EVER passed to Firestore setDoc/addDoc/updateDoc
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return {} as T;
  }
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val === undefined) {
      continue; // completely omit undefined fields
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = cleanForFirestore(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { shopCode, partnerId } = useAuthRole();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [udhaarPayments, setUdhaarPayments] = useState<UdhaarPayment[]>([]);
  const [capitalContributions, setCapitalContributions] = useState<CapitalContribution[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({ ...DEFAULT_SHOP_SETTINGS, shopCode: shopCode || '' });

  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  const [undoState, setUndoState] = useState<DeletedItemUndoState | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Active Partner Name based on partnerId and shop settings
  const activePartnerName = React.useMemo(() => {
    const p = settings.partners?.find(part => part.id === partnerId);
    return p ? p.name : partnerId === 'p1' ? 'Partner 1' : partnerId === 'p2' ? 'Partner 2' : 'Partner 3';
  }, [settings.partners, partnerId]);

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to trigger Undo toast for 6 seconds
  const triggerUndo = (state: DeletedItemUndoState) => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoState(state);
    const timer = setTimeout(() => {
      setUndoState(null);
    }, 6000);
    setUndoTimer(timer);
  };

  const clearUndoState = () => {
    if (undoTimer) clearTimeout(undoTimer);
    setUndoState(null);
  };

  // Log activity helper
  const logActivity = useCallback(async (
    action: 'create' | 'edit' | 'delete' | 'settle',
    entityType: 'stock' | 'sale' | 'expense' | 'udhaar' | 'capital' | 'settlement',
    entityName: string,
    details: string,
    oldValues?: string,
    newValues?: string
  ) => {
    if (!shopCode) return;
    try {
      const logsRef = collection(db, 'shops', shopCode, 'activity_logs');
      const newDocRef = doc(logsRef);
      const logData: ActivityLog = {
        id: newDocRef.id,
        action,
        entityType,
        entityName,
        details,
        oldValues: oldValues || '',
        newValues: newValues || '',
        partnerRole: activePartnerName,
        timestamp: Date.now()
      };
      await setDoc(newDocRef, logData);
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  }, [shopCode, activePartnerName]);

  // Real-time Firestore listeners for active Shop Code
  useEffect(() => {
    if (!shopCode) {
      setStockItems([]);
      setSales([]);
      setExpenses([]);
      setUdhaarPayments([]);
      setCapitalContributions([]);
      setSettlements([]);
      setActivityLogs([]);
      setSettings({ ...DEFAULT_SHOP_SETTINGS, shopCode: '' });
      setLoading(false);
      return;
    }

    setLoading(true);

    const stockRef = collection(db, 'shops', shopCode, 'stock');
    const salesRef = collection(db, 'shops', shopCode, 'sales');
    const expensesRef = collection(db, 'shops', shopCode, 'expenses');
    const udhaarRef = collection(db, 'shops', shopCode, 'udhaar_payments');
    const capitalRef = collection(db, 'shops', shopCode, 'capital_contributions');
    const settlementsRef = collection(db, 'shops', shopCode, 'settlements');
    const logsRef = collection(db, 'shops', shopCode, 'activity_logs');
    const settingsDocRef = doc(db, 'shops', shopCode, 'meta', 'settings');

    const updateSync = () => setLastSynced(Date.now());

    // Settings listener
    const unsubSettings = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ShopSettings;
        setSettings({
          ...DEFAULT_SHOP_SETTINGS,
          ...data,
          shopCode,
          partners: data.partners && data.partners.length === 3 ? data.partners : DEFAULT_SHOP_SETTINGS.partners
        });
      } else {
        const initSettings = { ...DEFAULT_SHOP_SETTINGS, shopCode };
        setDoc(settingsDocRef, initSettings).catch(console.error);
        setSettings(initSettings);
      }
      updateSync();
      setLoading(false);
    }, err => {
      console.error('Settings snapshot error:', err);
      setLoading(false);
    });

    const unsubStock = onSnapshot(stockRef, (snapshot) => {
      const items: StockItem[] = snapshot.docs.map(d => d.data() as StockItem);
      setStockItems(items.sort((a, b) => b.updatedAt - a.updatedAt));
      updateSync();
      setLoading(false);
    }, err => {
      console.error('Stock snapshot error:', err);
      setLoading(false);
    });

    const unsubSales = onSnapshot(salesRef, (snapshot) => {
      const list: Sale[] = snapshot.docs.map(d => d.data() as Sale);
      setSales(list.sort((a, b) => b.createdAt - a.createdAt));
      updateSync();
    }, err => console.error('Sales snapshot error:', err));

    const unsubExpenses = onSnapshot(expensesRef, (snapshot) => {
      const list: Expense[] = snapshot.docs.map(d => d.data() as Expense);
      setExpenses(list.sort((a, b) => b.createdAt - a.createdAt));
      updateSync();
    }, err => console.error('Expenses snapshot error:', err));

    const unsubUdhaar = onSnapshot(udhaarRef, (snapshot) => {
      const list: UdhaarPayment[] = snapshot.docs.map(d => d.data() as UdhaarPayment);
      setUdhaarPayments(list.sort((a, b) => b.createdAt - a.createdAt));
      updateSync();
    }, err => console.error('Udhaar snapshot error:', err));

    const unsubCapital = onSnapshot(capitalRef, (snapshot) => {
      const list: CapitalContribution[] = snapshot.docs.map(d => d.data() as CapitalContribution);
      setCapitalContributions(list.sort((a, b) => b.createdAt - a.createdAt));
      updateSync();
    }, err => console.error('Capital snapshot error:', err));

    const unsubSettlements = onSnapshot(settlementsRef, (snapshot) => {
      const list: Settlement[] = snapshot.docs.map(d => d.data() as Settlement);
      setSettlements(list.sort((a, b) => b.settledAt - a.settledAt));
      updateSync();
    }, err => console.error('Settlements snapshot error:', err));

    const unsubLogs = onSnapshot(logsRef, (snapshot) => {
      const list: ActivityLog[] = snapshot.docs.map(d => d.data() as ActivityLog);
      setActivityLogs(list.sort((a, b) => b.timestamp - a.timestamp));
      updateSync();
      setLoading(false);
    }, err => {
      console.error('Logs snapshot error:', err);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubStock();
      unsubSales();
      unsubExpenses();
      unsubUdhaar();
      unsubCapital();
      unsubSettlements();
      unsubLogs();
    };
  }, [shopCode]);

  // Derived: Shopkeeper Udhaar Balances
  const shopkeepers: ShopkeeperSummary[] = React.useMemo(() => {
    const map = new Map<string, { creditSales: number; payments: number; lastDate: string; count: number }>();

    sales.forEach(s => {
      if (s.paymentType === 'credit' && s.shopkeeperName?.trim()) {
        const name = s.shopkeeperName.trim();
        const existing = map.get(name) || { creditSales: 0, payments: 0, lastDate: s.date, count: 0 };
        existing.creditSales += s.totalSaleAmount;
        existing.count += 1;
        if (s.date > existing.lastDate) existing.lastDate = s.date;
        map.set(name, existing);
      }
    });

    udhaarPayments.forEach(p => {
      if (p.shopkeeperName?.trim()) {
        const name = p.shopkeeperName.trim();
        const existing = map.get(name) || { creditSales: 0, payments: 0, lastDate: p.date, count: 0 };
        existing.payments += p.amount;
        existing.count += 1;
        if (p.date > existing.lastDate) existing.lastDate = p.date;
        map.set(name, existing);
      }
    });

    const result: ShopkeeperSummary[] = [];
    map.forEach((data, name) => {
      result.push({
        name,
        totalCreditSales: data.creditSales,
        totalPayments: data.payments,
        netBalanceDue: data.creditSales - data.payments,
        lastTransactionDate: data.lastDate,
        transactionCount: data.count
      });
    });

    return result.sort((a, b) => b.netBalanceDue - a.netBalanceDue);
  }, [sales, udhaarPayments]);

  const totalOutstandingUdhaar = React.useMemo(() => {
    return shopkeepers.reduce((sum, sk) => sum + Math.max(0, sk.netBalanceDue), 0);
  }, [shopkeepers]);

  const totalCapitalRaised = React.useMemo(() => {
    return capitalContributions.reduce((sum, c) => sum + c.amount, 0);
  }, [capitalContributions]);

  const lastSettlementTimestamp = React.useMemo(() => {
    if (!settlements.length) return 0;
    return Math.max(...settlements.map(s => s.settledAt));
  }, [settlements]);

  // Unsettled Financials
  const unsettledSalesList = React.useMemo(() => {
    return sales.filter(s => s.createdAt > lastSettlementTimestamp);
  }, [sales, lastSettlementTimestamp]);

  const unsettledExpensesList = React.useMemo(() => {
    return expenses.filter(e => e.createdAt > lastSettlementTimestamp);
  }, [expenses, lastSettlementTimestamp]);

  const unsettledSales = React.useMemo(() => {
    return unsettledSalesList.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  }, [unsettledSalesList]);

  const unsettledExpenses = React.useMemo(() => {
    return unsettledExpensesList.reduce((sum, e) => sum + e.amount, 0);
  }, [unsettledExpensesList]);

  const unsettledCOGS = React.useMemo(() => {
    return unsettledSalesList.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  }, [unsettledSalesList]);

  const unsettledProfit = React.useMemo(() => {
    return unsettledSales - unsettledCOGS - unsettledExpenses;
  }, [unsettledSales, unsettledCOGS, unsettledExpenses]);

  // --- ACTIONS ---

  // Settings Actions
  const updateShopSettings = async (newSettings: Partial<ShopSettings>) => {
    if (!shopCode) return;
    const merged = cleanForFirestore({ ...settings, ...newSettings, shopCode });
    const settingsDocRef = doc(db, 'shops', shopCode, 'meta', 'settings');
    await setDoc(settingsDocRef, merged);
    setSettings(merged as ShopSettings);
    await logActivity('edit', 'settlement', 'Shop Settings', `Updated shop configuration & partner profit ratios`);
  };

  // Stock Actions
  const addOrUpdateStock = async (
    name: string, 
    unit: string, 
    quantity: number, 
    purchasePrice: number,
    date?: string,
    billImageUrl?: string
  ) => {
    if (!shopCode) return;
    const cleanName = name.trim();
    if (!cleanName || quantity <= 0 || purchasePrice < 0) return;

    const stockDate = date?.trim() || new Date().toISOString().split('T')[0];
    const existingIndex = stockItems.findIndex(i => i.name.toLowerCase() === cleanName.toLowerCase());

    if (existingIndex >= 0) {
      const existing = stockItems[existingIndex];
      const newQty = existing.quantity + quantity;
      const docRef = doc(db, 'shops', shopCode, 'stock', existing.id);
      
      const updated: Record<string, any> = {
        quantity: newQty,
        purchasePrice,
        unit: unit.trim() || existing.unit || 'pcs',
        date: stockDate,
        updatedAt: Date.now(),
        createdByRole: activePartnerName || 'Partner'
      };
      if (billImageUrl && billImageUrl.trim()) {
        updated.billImageUrl = billImageUrl.trim();
      }

      await updateDoc(docRef, cleanForFirestore(updated));
      await logActivity(
        'edit', 
        'stock', 
        existing.name, 
        `Updated stock (+${quantity} = ${newQty} ${updated.unit}) @ Rs. ${purchasePrice}${billImageUrl ? ' with attached purchase bill' : ''}`,
        `Qty: ${existing.quantity}, Price: ${existing.purchasePrice}`,
        `Qty: ${newQty}, Price: ${purchasePrice}`
      );
    } else {
      const docRef = doc(collection(db, 'shops', shopCode, 'stock'));
      const newItem: Record<string, any> = {
        id: docRef.id,
        name: cleanName,
        unit: unit.trim() || 'pcs',
        quantity,
        purchasePrice,
        date: stockDate,
        updatedAt: Date.now(),
        createdByRole: activePartnerName || 'Partner'
      };
      if (billImageUrl && billImageUrl.trim()) {
        newItem.billImageUrl = billImageUrl.trim();
      }

      await setDoc(docRef, cleanForFirestore(newItem));
      await logActivity(
        'create', 
        'stock', 
        cleanName, 
        `Added new stock item: ${quantity} ${newItem.unit} @ Rs. ${purchasePrice}${billImageUrl ? ' with attached purchase bill' : ''}`
      );
    }
  };

  const editStock = async (
    id: string, 
    name: string, 
    unit: string, 
    quantity: number, 
    purchasePrice: number,
    date?: string,
    billImageUrl?: string
  ) => {
    if (!shopCode) return;
    const existing = stockItems.find(i => i.id === id);
    if (!existing) return;

    if (quantity < 0) {
      throw new Error('Stock quantity cannot drop below zero');
    }

    const docRef = doc(db, 'shops', shopCode, 'stock', id);
    const updated: Record<string, any> = {
      id: existing.id,
      name: name.trim(),
      unit: unit.trim() || existing.unit || 'pcs',
      quantity,
      purchasePrice,
      date: date?.trim() || existing.date || new Date().toISOString().split('T')[0],
      updatedAt: Date.now(),
      createdByRole: activePartnerName || existing.createdByRole || 'Partner'
    };

    const finalBillUrl = billImageUrl !== undefined ? billImageUrl?.trim() : existing.billImageUrl;
    if (finalBillUrl) {
      updated.billImageUrl = finalBillUrl;
    }

    await setDoc(docRef, cleanForFirestore(updated));
    await logActivity(
      'edit',
      'stock',
      updated.name,
      `Edited stock: ${quantity} ${updated.unit} @ Rs. ${purchasePrice}${updated.billImageUrl ? ' (updated purchase bill photo)' : ''}`,
      `Name: ${existing.name}, Qty: ${existing.quantity}, Price: ${existing.purchasePrice}`,
      `Name: ${updated.name}, Qty: ${quantity}, Price: ${purchasePrice}`
    );
  };

  const deleteStock = async (id: string) => {
    if (!shopCode) return;
    const existing = stockItems.find(i => i.id === id);
    if (!existing) return;

    triggerUndo({
      item: existing,
      entityType: 'stock'
    });

    const docRef = doc(db, 'shops', shopCode, 'stock', id);
    await deleteDoc(docRef);
    await logActivity('delete', 'stock', existing.name, `Deleted stock item: ${existing.quantity} ${existing.unit}`);
  };

  // Sales Actions
  const addSale = async (
    itemId: string, 
    quantity: number, 
    salePrice: number, 
    paymentType: PaymentType, 
    shopkeeperName?: string,
    date?: string,
    customInvoiceNo?: string,
    billImageUrl?: string
  ) => {
    if (!shopCode) return;
    const stockItem = stockItems.find(i => i.id === itemId);
    if (!stockItem) {
      throw new Error('Selected stock item not found.');
    }

    if (quantity > stockItem.quantity) {
      throw new Error(`Sale quantity (${quantity}) exceeds available stock (${stockItem.quantity})!`);
    }

    const cleanShopkeeper = shopkeeperName?.trim() || '';
    if (paymentType === 'credit' && !cleanShopkeeper) {
      throw new Error('Shopkeeper/Customer name is required for credit (Udhaar) sales.');
    }

    // Deduct stock
    const stockDocRef = doc(db, 'shops', shopCode, 'stock', stockItem.id);
    const newStockQty = stockItem.quantity - quantity;
    await updateDoc(stockDocRef, cleanForFirestore({
      quantity: newStockQty,
      updatedAt: Date.now()
    }));

    // Create Sale doc
    const salesColRef = collection(db, 'shops', shopCode, 'sales');
    const newSaleRef = doc(salesColRef);
    const saleDate = date?.trim() || new Date().toISOString().split('T')[0];
    const totalSaleAmount = quantity * salePrice;
    const invNo = customInvoiceNo?.trim() || `INV-${Date.now().toString().slice(-6)}`;

    const newSale: Record<string, any> = {
      id: newSaleRef.id,
      itemId: stockItem.id,
      itemName: stockItem.name,
      unit: stockItem.unit,
      quantity,
      purchasePrice: stockItem.purchasePrice,
      salePrice,
      totalSaleAmount,
      paymentType,
      date: saleDate,
      invoiceNo: invNo,
      createdAt: Date.now(),
      createdByRole: activePartnerName || 'Partner'
    };

    if (cleanShopkeeper) {
      newSale.shopkeeperName = cleanShopkeeper;
    }

    const cleanBillUrl = billImageUrl?.trim();
    if (cleanBillUrl) {
      newSale.billImageUrl = cleanBillUrl;
    }

    await setDoc(newSaleRef, cleanForFirestore(newSale));

    await logActivity(
      'create',
      'sale',
      stockItem.name,
      `Sale: ${quantity} ${stockItem.unit} @ Rs. ${salePrice} = Rs. ${totalSaleAmount} (${paymentType.toUpperCase()}${cleanShopkeeper ? ` to ${cleanShopkeeper}` : ''})${cleanBillUrl ? ' with attached slip/bill' : ''}`
    );
  };

  const editSale = async (
    saleId: string, 
    newQuantity: number, 
    newSalePrice: number, 
    newPaymentType: PaymentType, 
    newShopkeeperName?: string,
    newDate?: string,
    billImageUrl?: string
  ) => {
    if (!shopCode) return;
    const oldSale = sales.find(s => s.id === saleId);
    if (!oldSale) return;

    const stockItem = stockItems.find(i => i.id === oldSale.itemId);
    if (!stockItem) {
      throw new Error('Associated stock item not found.');
    }

    const effectiveAvailableStock = stockItem.quantity + oldSale.quantity;
    if (newQuantity > effectiveAvailableStock) {
      throw new Error(`New sale quantity (${newQuantity}) exceeds available stock (${effectiveAvailableStock})!`);
    }

    const cleanShopkeeper = newShopkeeperName !== undefined 
      ? newShopkeeperName.trim() 
      : (oldSale.shopkeeperName || '');

    if (newPaymentType === 'credit' && !cleanShopkeeper) {
      throw new Error('Shopkeeper/Customer name is required for credit sales.');
    }

    const updatedStockQty = effectiveAvailableStock - newQuantity;
    const stockDocRef = doc(db, 'shops', shopCode, 'stock', stockItem.id);
    await updateDoc(stockDocRef, cleanForFirestore({
      quantity: updatedStockQty,
      updatedAt: Date.now()
    }));

    const saleDocRef = doc(db, 'shops', shopCode, 'sales', saleId);
    const updatedSale: Record<string, any> = {
      id: oldSale.id,
      itemId: oldSale.itemId,
      itemName: oldSale.itemName,
      unit: oldSale.unit,
      quantity: newQuantity,
      purchasePrice: oldSale.purchasePrice,
      salePrice: newSalePrice,
      totalSaleAmount: newQuantity * newSalePrice,
      paymentType: newPaymentType,
      date: newDate?.trim() || oldSale.date || new Date().toISOString().split('T')[0],
      invoiceNo: oldSale.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
      createdAt: oldSale.createdAt || Date.now(),
      createdByRole: activePartnerName || oldSale.createdByRole || 'Partner'
    };

    if (cleanShopkeeper) {
      updatedSale.shopkeeperName = cleanShopkeeper;
    }

    const finalBillUrl = billImageUrl !== undefined ? billImageUrl?.trim() : oldSale.billImageUrl;
    if (finalBillUrl) {
      updatedSale.billImageUrl = finalBillUrl;
    }

    await setDoc(saleDocRef, cleanForFirestore(updatedSale));

    await logActivity(
      'edit',
      'sale',
      oldSale.itemName,
      `Edited sale for ${oldSale.itemName}: Qty ${oldSale.quantity}->${newQuantity}, Amount Rs. ${oldSale.totalSaleAmount}->${updatedSale.totalSaleAmount}${finalBillUrl ? ' (updated sale slip photo)' : ''}`,
      `Qty: ${oldSale.quantity}, Amount: Rs. ${oldSale.totalSaleAmount}, Type: ${oldSale.paymentType}`,
      `Qty: ${newQuantity}, Amount: Rs. ${updatedSale.totalSaleAmount}, Type: ${newPaymentType}`
    );
  };

  const deleteSale = async (saleId: string) => {
    if (!shopCode) return;
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const stockItem = stockItems.find(i => i.id === sale.itemId);

    if (stockItem) {
      const stockDocRef = doc(db, 'shops', shopCode, 'stock', stockItem.id);
      await updateDoc(stockDocRef, cleanForFirestore({
        quantity: stockItem.quantity + sale.quantity,
        updatedAt: Date.now()
      }));
    }

    triggerUndo({
      item: sale,
      entityType: 'sale',
      stockRestoration: stockItem ? { itemId: stockItem.id, quantityToRestore: sale.quantity } : undefined
    });

    const saleDocRef = doc(db, 'shops', shopCode, 'sales', saleId);
    await deleteDoc(saleDocRef);

    await logActivity(
      'delete',
      'sale',
      sale.itemName,
      `Deleted sale of ${sale.quantity} ${sale.unit} (Restored ${sale.quantity} to stock)`
    );
  };

  // Expenses Actions
  const addExpense = async (category: ExpenseCategory, amount: number, note?: string, details?: string, date?: string) => {
    if (!shopCode) return;
    if (category === 'Other' && (!details || !details.trim())) {
      throw new Error('Details are mandatory when category is "Other".');
    }
    if (amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const expColRef = collection(db, 'shops', shopCode, 'expenses');
    const newDocRef = doc(expColRef);
    const expDate = date?.trim() || new Date().toISOString().split('T')[0];

    const newExpense: Record<string, any> = {
      id: newDocRef.id,
      category,
      amount,
      date: expDate,
      createdAt: Date.now(),
      createdByRole: activePartnerName || 'Partner'
    };

    const cleanNote = note?.trim();
    if (cleanNote) {
      newExpense.note = cleanNote;
    }

    // Only include details key when category is 'Other'
    if (category === 'Other') {
      const cleanDetails = details?.trim();
      if (cleanDetails) {
        newExpense.details = cleanDetails;
      }
    }

    await setDoc(newDocRef, cleanForFirestore(newExpense));
    await logActivity(
      'create',
      'expense',
      category,
      `Recorded expense: Rs. ${amount} (${category}${category === 'Other' && newExpense.details ? `: ${newExpense.details}` : ''})`
    );
  };

  const editExpense = async (id: string, category: ExpenseCategory, amount: number, note?: string, details?: string, date?: string) => {
    if (!shopCode) return;
    const existing = expenses.find(e => e.id === id);
    if (!existing) return;

    if (category === 'Other' && (!details || !details.trim())) {
      throw new Error('Details are mandatory when category is "Other".');
    }

    const docRef = doc(db, 'shops', shopCode, 'expenses', id);
    const updated: Record<string, any> = {
      id: existing.id,
      category,
      amount,
      date: date?.trim() || existing.date || new Date().toISOString().split('T')[0],
      createdAt: existing.createdAt || Date.now(),
      createdByRole: activePartnerName || existing.createdByRole || 'Partner'
    };

    const cleanNote = note !== undefined ? note.trim() : (existing.note || '');
    if (cleanNote) {
      updated.note = cleanNote;
    }

    // Only include details key when category is 'Other'
    if (category === 'Other') {
      const cleanDetails = details !== undefined ? details.trim() : (existing.details || '');
      if (cleanDetails) {
        updated.details = cleanDetails;
      }
    }

    await setDoc(docRef, cleanForFirestore(updated));
    await logActivity(
      'edit',
      'expense',
      category,
      `Edited expense: Rs. ${existing.amount} -> Rs. ${amount}`
    );
  };

  const deleteExpense = async (id: string) => {
    if (!shopCode) return;
    const existing = expenses.find(e => e.id === id);
    if (!existing) return;

    triggerUndo({
      item: existing,
      entityType: 'expense'
    });

    const docRef = doc(db, 'shops', shopCode, 'expenses', id);
    await deleteDoc(docRef);
    await logActivity('delete', 'expense', existing.category, `Deleted expense of Rs. ${existing.amount}`);
  };

  // Udhaar Payment Actions
  const addUdhaarPayment = async (shopkeeperName: string, amount: number, note?: string, date?: string) => {
    if (!shopCode) return;
    const name = shopkeeperName.trim();
    if (!name || amount <= 0) {
      throw new Error('Please enter a valid shopkeeper name and amount greater than 0.');
    }

    const udhaarColRef = collection(db, 'shops', shopCode, 'udhaar_payments');
    const newDocRef = doc(udhaarColRef);
    const payDate = date?.trim() || new Date().toISOString().split('T')[0];

    const newPayment: Record<string, any> = {
      id: newDocRef.id,
      shopkeeperName: name,
      amount,
      date: payDate,
      createdAt: Date.now(),
      createdByRole: activePartnerName || 'Partner'
    };

    const cleanNote = note?.trim();
    if (cleanNote) {
      newPayment.note = cleanNote;
    }

    await setDoc(newDocRef, cleanForFirestore(newPayment));
    await logActivity(
      'create',
      'udhaar',
      name,
      `Recorded udhaar payment: Rs. ${amount} received from ${name}`
    );
  };

  const editUdhaarPayment = async (id: string, shopkeeperName: string, amount: number, note?: string, date?: string) => {
    if (!shopCode) return;
    const existing = udhaarPayments.find(p => p.id === id);
    if (!existing) return;

    const docRef = doc(db, 'shops', shopCode, 'udhaar_payments', id);
    const updated: Record<string, any> = {
      id: existing.id,
      shopkeeperName: shopkeeperName.trim(),
      amount,
      date: date?.trim() || existing.date || new Date().toISOString().split('T')[0],
      createdAt: existing.createdAt || Date.now(),
      createdByRole: activePartnerName || existing.createdByRole || 'Partner'
    };

    const cleanNote = note !== undefined ? note.trim() : (existing.note || '');
    if (cleanNote) {
      updated.note = cleanNote;
    }

    await setDoc(docRef, cleanForFirestore(updated));
    await logActivity(
      'edit',
      'udhaar',
      updated.shopkeeperName,
      `Edited payment from ${existing.shopkeeperName}: Rs. ${existing.amount} -> Rs. ${amount}`
    );
  };

  const deleteUdhaarPayment = async (id: string) => {
    if (!shopCode) return;
    const existing = udhaarPayments.find(p => p.id === id);
    if (!existing) return;

    triggerUndo({
      item: existing,
      entityType: 'udhaar'
    });

    const docRef = doc(db, 'shops', shopCode, 'udhaar_payments', id);
    await deleteDoc(docRef);
    await logActivity('delete', 'udhaar', existing.shopkeeperName, `Deleted udhaar payment record of Rs. ${existing.amount}`);
  };

  // Capital Contribution Actions
  const addCapitalContribution = async (contributorName: string, amount: number, note?: string, date?: string) => {
    if (!shopCode) return;
    const name = contributorName.trim();
    if (!name || amount <= 0) {
      throw new Error('Please enter a valid contributor name and amount greater than 0.');
    }

    const capColRef = collection(db, 'shops', shopCode, 'capital_contributions');
    const newDocRef = doc(capColRef);
    const capDate = date?.trim() || new Date().toISOString().split('T')[0];

    const newCapital: Record<string, any> = {
      id: newDocRef.id,
      contributorName: name,
      amount,
      date: capDate,
      createdAt: Date.now(),
      createdByRole: activePartnerName || 'Partner'
    };

    const cleanNote = note?.trim();
    if (cleanNote) {
      newCapital.note = cleanNote;
    }

    await setDoc(newDocRef, cleanForFirestore(newCapital));
    await logActivity(
      'create',
      'capital',
      name,
      `Capital Added: Rs. ${amount} by ${name}`
    );
  };

  const editCapitalContribution = async (id: string, contributorName: string, amount: number, note?: string, date?: string) => {
    if (!shopCode) return;
    const existing = capitalContributions.find(c => c.id === id);
    if (!existing) return;

    const docRef = doc(db, 'shops', shopCode, 'capital_contributions', id);
    const updated: Record<string, any> = {
      id: existing.id,
      contributorName: contributorName.trim(),
      amount,
      date: date?.trim() || existing.date || new Date().toISOString().split('T')[0],
      createdAt: existing.createdAt || Date.now(),
      createdByRole: activePartnerName || existing.createdByRole || 'Partner'
    };

    const cleanNote = note !== undefined ? note.trim() : (existing.note || '');
    if (cleanNote) {
      updated.note = cleanNote;
    }

    await setDoc(docRef, cleanForFirestore(updated));
    await logActivity(
      'edit',
      'capital',
      updated.contributorName,
      `Edited capital contribution: Rs. ${existing.amount} -> Rs. ${amount}`
    );
  };

  const deleteCapitalContribution = async (id: string) => {
    if (!shopCode) return;
    const existing = capitalContributions.find(c => c.id === id);
    if (!existing) return;

    triggerUndo({
      item: existing,
      entityType: 'capital'
    });

    const docRef = doc(db, 'shops', shopCode, 'capital_contributions', id);
    await deleteDoc(docRef);
    await logActivity('delete', 'capital', existing.contributorName, `Deleted capital contribution of Rs. ${existing.amount}`);
  };

  // Settlement Actions (Dynamic 3-Partner Percentage Ratio & Weekly/Fortnightly frequency)
  const markAsSettled = async (note?: string, customDateRange?: { start: number; end: number }) => {
    if (!shopCode) return;

    const periodStart = customDateRange?.start || lastSettlementTimestamp;
    const periodEnd = customDateRange?.end || Date.now();

    const periodSales = sales.filter(s => s.createdAt > periodStart && s.createdAt <= periodEnd);
    const periodExpenses = expenses.filter(e => e.createdAt > periodStart && e.createdAt <= periodEnd);

    const totalSales = periodSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
    const totalCOGS = periodSales.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
    const totalExp = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalCOGS - totalExp;

    const partners = settings.partners && settings.partners.length === 3 
      ? settings.partners 
      : DEFAULT_SHOP_SETTINGS.partners;

    const shares = partners.map(p => ({
      partnerId: p.id,
      partnerName: p.name,
      percent: p.sharePercent,
      amount: (netProfit * p.sharePercent) / 100
    }));

    const partnerShares = partners.map(p => ({
      partnerId: p.id,
      partnerName: p.name,
      sharePercent: p.sharePercent,
      amount: (netProfit * p.sharePercent) / 100
    }));

    const settlementsColRef = collection(db, 'shops', shopCode, 'settlements');
    const newDocRef = doc(settlementsColRef);

    const newSettlement: Record<string, any> = {
      id: newDocRef.id,
      periodStart,
      periodEnd,
      totalSales,
      totalCOGS,
      totalExpenses: totalExp,
      netProfit,
      settlementFrequency: settings.settlementFrequency || 'weekly',
      shares,
      partnerShares,
      partner1Share: shares[0]?.amount || 0,
      partner2Share: shares[1]?.amount || 0,
      partner3Share: shares[2]?.amount || 0,
      settledAt: periodEnd,
      settledByRole: activePartnerName || 'Partner'
    };

    const cleanNote = note?.trim();
    if (cleanNote) {
      newSettlement.note = cleanNote;
    }

    await setDoc(newDocRef, cleanForFirestore(newSettlement));

    const partnerSummaryText = shares.map(s => `${s.partnerName} (${s.percent}%): Rs. ${Math.round(s.amount)}`).join(', ');

    await logActivity(
      'settle',
      'settlement',
      'Settlement Closed',
      `Settled (${settings.settlementFrequency}): Net Profit Rs. ${netProfit.toLocaleString()} [${partnerSummaryText}]`
    );
  };

  // Undo Last Delete
  const undoLastDelete = async () => {
    if (!shopCode || !undoState) return;

    const { item, entityType, stockRestoration } = undoState;

    if (entityType === 'stock') {
      const stockItem = item as StockItem;
      await setDoc(doc(db, 'shops', shopCode, 'stock', stockItem.id), cleanForFirestore(stockItem));
      await logActivity('create', 'stock', stockItem.name, `Undid deletion of stock item ${stockItem.name}`);
    } else if (entityType === 'sale') {
      const sale = item as Sale;
      if (stockRestoration) {
        const currentStock = stockItems.find(i => i.id === stockRestoration.itemId);
        if (currentStock) {
          const reDeductedQty = Math.max(0, currentStock.quantity - stockRestoration.quantityToRestore);
          await updateDoc(doc(db, 'shops', shopCode, 'stock', currentStock.id), cleanForFirestore({
            quantity: reDeductedQty,
            updatedAt: Date.now()
          }));
        }
      }
      await setDoc(doc(db, 'shops', shopCode, 'sales', sale.id), cleanForFirestore(sale));
      await logActivity('create', 'sale', sale.itemName, `Undid deletion of sale for ${sale.itemName}`);
    } else if (entityType === 'expense') {
      const exp = item as Expense;
      await setDoc(doc(db, 'shops', shopCode, 'expenses', exp.id), cleanForFirestore(exp));
      await logActivity('create', 'expense', exp.category, `Undid deletion of expense`);
    } else if (entityType === 'udhaar') {
      const pay = item as UdhaarPayment;
      await setDoc(doc(db, 'shops', shopCode, 'udhaar_payments', pay.id), cleanForFirestore(pay));
      await logActivity('create', 'udhaar', pay.shopkeeperName, `Undid deletion of udhaar payment`);
    } else if (entityType === 'capital') {
      const cap = item as CapitalContribution;
      await setDoc(doc(db, 'shops', shopCode, 'capital_contributions', cap.id), cleanForFirestore(cap));
      await logActivity('create', 'capital', cap.contributorName, `Undid deletion of capital contribution`);
    }

    clearUndoState();
  };

  // Sync Backup Data (JSON)
  const backupAllData = (): string => {
    const backupObj = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      shopCode,
      settings,
      stockItems,
      sales,
      expenses,
      udhaarPayments,
      capitalContributions,
      settlements,
      activityLogs
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const exportBackupData = async (): Promise<string> => {
    return backupAllData();
  };

  // Restore from Backup Data (JSON)
  const restoreFromBackup = async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
    if (!shopCode) return { success: false, error: 'Shop is not connected.' };
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid backup file format.' };
      }

      if (data.settings) {
        await setDoc(doc(db, 'shops', shopCode, 'meta', 'settings'), cleanForFirestore({ ...data.settings, shopCode }));
      }

      if (Array.isArray(data.stockItems)) {
        for (const item of data.stockItems) {
          if (item.id) await setDoc(doc(db, 'shops', shopCode, 'stock', item.id), cleanForFirestore(item));
        }
      }
      if (Array.isArray(data.sales)) {
        for (const s of data.sales) {
          if (s.id) await setDoc(doc(db, 'shops', shopCode, 'sales', s.id), cleanForFirestore(s));
        }
      }
      if (Array.isArray(data.expenses)) {
        for (const e of data.expenses) {
          if (e.id) await setDoc(doc(db, 'shops', shopCode, 'expenses', e.id), cleanForFirestore(e));
        }
      }
      if (Array.isArray(data.udhaarPayments)) {
        for (const u of data.udhaarPayments) {
          if (u.id) await setDoc(doc(db, 'shops', shopCode, 'udhaar_payments', u.id), cleanForFirestore(u));
        }
      }
      if (Array.isArray(data.capitalContributions)) {
        for (const c of data.capitalContributions) {
          if (c.id) await setDoc(doc(db, 'shops', shopCode, 'capital_contributions', c.id), cleanForFirestore(c));
        }
      }
      if (Array.isArray(data.settlements)) {
        for (const st of data.settlements) {
          if (st.id) await setDoc(doc(db, 'shops', shopCode, 'settlements', st.id), cleanForFirestore(st));
        }
      }

      await logActivity('create', 'settlement', 'Backup Restored', `Restored all shop data from JSON backup`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse JSON backup.' };
    }
  };

  const restoreBackupData = async (jsonString: string): Promise<boolean> => {
    const res = await restoreFromBackup(jsonString);
    return res.success;
  };

  return (
    <ShopContext.Provider
      value={{
        stockItems,
        sales,
        expenses,
        udhaarPayments,
        capitalContributions,
        settlements,
        activityLogs,
        settings,
        loading,
        isOnline,
        lastSynced,
        shopkeepers,
        totalOutstandingUdhaar,
        totalCapitalRaised,
        lastSettlementTimestamp,
        unsettledSales,
        unsettledExpenses,
        unsettledProfit,
        activePartnerName,
        updateShopSettings,
        addOrUpdateStock,
        editStock,
        deleteStock,
        addSale,
        editSale,
        deleteSale,
        addExpense,
        editExpense,
        deleteExpense,
        addUdhaarPayment,
        editUdhaarPayment,
        deleteUdhaarPayment,
        addCapitalContribution,
        editCapitalContribution,
        deleteCapitalContribution,
        markAsSettled,
        undoState,
        undoLastDelete,
        clearUndoState,
        backupAllData,
        restoreFromBackup,
        exportBackupData,
        restoreBackupData
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
