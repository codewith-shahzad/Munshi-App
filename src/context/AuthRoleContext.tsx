import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PartnerId } from '../types';

interface PinSettings {
  enabled: boolean;
  pin: string;
  secretPhrase: string;
}

interface AuthRoleContextType {
  partnerId: PartnerId;
  setPartnerId: (id: PartnerId) => void;
  partnerRole: string; // for backward compatibility & display
  setPartnerRole: (role: string) => void;
  shopCode: string | null;
  setShopCode: (code: string | null) => void;
  leaveShop: () => void;
  pinSettings: PinSettings;
  updatePinSettings: (settings: PinSettings) => void;
  isLocked: boolean;
  unlockWithPin: (inputPin: string) => boolean;
  resetPinWithPhrase: (phrase: string, newPin: string) => boolean;
  lockApp: () => void;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

const PARTNER_ID_KEY = 'munshi_partner_id';
const ROLE_KEY = 'munshi_partner_role';
const SHOP_CODE_KEY = 'munshi_shop_code';
const PIN_SETTINGS_KEY = 'munshi_pin_settings';

export const AuthRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [partnerId, setPartnerIdState] = useState<PartnerId>(() => {
    const saved = localStorage.getItem(PARTNER_ID_KEY);
    if (saved === 'p1' || saved === 'p2' || saved === 'p3') return saved;
    const oldRole = localStorage.getItem(ROLE_KEY);
    if (oldRole?.includes('Partner 2') || oldRole?.includes('p2')) return 'p2';
    if (oldRole?.includes('Partner 3') || oldRole?.includes('p3')) return 'p3';
    return 'p1';
  });

  const [partnerRole, setPartnerRoleState] = useState<string>(() => {
    return localStorage.getItem(ROLE_KEY) || 'Partner 1';
  });

  const [shopCode, setShopCodeState] = useState<string | null>(() => {
    return localStorage.getItem(SHOP_CODE_KEY);
  });

  const [pinSettings, setPinSettingsState] = useState<PinSettings>(() => {
    const saved = localStorage.getItem(PIN_SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return { enabled: false, pin: '', secretPhrase: '' };
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const savedPin = localStorage.getItem(PIN_SETTINGS_KEY);
    if (savedPin) {
      try {
        const parsed = JSON.parse(savedPin);
        return Boolean(parsed.enabled && parsed.pin);
      } catch (e) { return false; }
    }
    return false;
  });

  const setPartnerId = (id: PartnerId) => {
    setPartnerIdState(id);
    localStorage.setItem(PARTNER_ID_KEY, id);
    const label = id === 'p1' ? 'Partner 1' : id === 'p2' ? 'Partner 2' : 'Partner 3';
    setPartnerRoleState(label);
    localStorage.setItem(ROLE_KEY, label);
  };

  const setPartnerRole = (role: string) => {
    setPartnerRoleState(role);
    localStorage.setItem(ROLE_KEY, role);
    if (role.includes('Partner 1') || role === 'p1') setPartnerIdState('p1');
    else if (role.includes('Partner 2') || role === 'p2') setPartnerIdState('p2');
    else if (role.includes('Partner 3') || role === 'p3') setPartnerIdState('p3');
  };

  const setShopCode = (code: string | null) => {
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setShopCodeState(cleanCode);
      localStorage.setItem(SHOP_CODE_KEY, cleanCode);
    } else {
      setShopCodeState(null);
      localStorage.removeItem(SHOP_CODE_KEY);
    }
  };

  const leaveShop = () => {
    setShopCodeState(null);
    localStorage.removeItem(SHOP_CODE_KEY);
  };

  const updatePinSettings = (newSettings: PinSettings) => {
    setPinSettingsState(newSettings);
    localStorage.setItem(PIN_SETTINGS_KEY, JSON.stringify(newSettings));
    if (!newSettings.enabled) {
      setIsLocked(false);
    }
  };

  const unlockWithPin = (inputPin: string): boolean => {
    if (pinSettings.pin && inputPin.trim() === pinSettings.pin.trim()) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const resetPinWithPhrase = (phrase: string, newPin: string): boolean => {
    if (
      pinSettings.secretPhrase && 
      phrase.trim().toLowerCase() === pinSettings.secretPhrase.trim().toLowerCase()
    ) {
      const updated = { ...pinSettings, pin: newPin, enabled: true };
      updatePinSettings(updated);
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (pinSettings.enabled && pinSettings.pin) {
      setIsLocked(true);
    }
  };

  return (
    <AuthRoleContext.Provider
      value={{
        partnerId,
        setPartnerId,
        partnerRole,
        setPartnerRole,
        shopCode,
        setShopCode,
        leaveShop,
        pinSettings,
        updatePinSettings,
        isLocked,
        unlockWithPin,
        resetPinWithPhrase,
        lockApp,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
};

export const useAuthRole = (): AuthRoleContextType => {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
};

