import React, { createContext, useContext, useState, useEffect } from 'react';
import { Shop, UserSession } from '../types';
import { account, checkAppwriteConnection } from '../services/appwrite';
import { getShop, updateShop } from '../services/storage';
import { SEED_SHOP } from '../services/seedData';

interface AuthContextType {
  user: UserSession | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    ownerName: string;
    shopName: string;
    mobile: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateShopData: (shopData: Shop) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'moti_dukaan_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on load
  useEffect(() => {
    async function initAuth() {
      try {
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSession) {
          const parsed: UserSession = JSON.parse(savedSession);
          setUser(parsed);
          const shopData = await getShop(parsed.shop.$id || 'shop_moti_demo');
          setShop(shopData || parsed.shop);
        } else {
          // Preload default demo session so initial visitor can instantly interact!
          const demoSession: UserSession = {
            userId: 'user_moti_demo',
            name: SEED_SHOP.ownerName,
            email: SEED_SHOP.email,
            shop: SEED_SHOP,
          };
          setUser(demoSession);
          setShop(SEED_SHOP);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoSession));
        }
      } catch (e) {
        console.error('Session init error', e);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Try Appwrite if configured
      const conn = await checkAppwriteConnection();
      if (conn.ok && import.meta.env.VITE_APPWRITE_PROJECT_ID !== 'moti-dukaan') {
        try {
          await account.createEmailPasswordSession(email, pass);
          const appwriteUser = await account.get();
          const userShop = (await getShop(appwriteUser.$id)) || {
            ...SEED_SHOP,
            ownerUserId: appwriteUser.$id,
            email: appwriteUser.email,
            ownerName: appwriteUser.name,
          };

          const session: UserSession = {
            userId: appwriteUser.$id,
            name: appwriteUser.name,
            email: appwriteUser.email,
            shop: userShop,
          };
          setUser(session);
          setShop(userShop);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
          return { success: true };
        } catch (appwriteErr: any) {
          return { success: false, error: appwriteErr?.message || 'Appwrite login failed.' };
        }
      }

      // Local / Offline validation
      if (!email || !pass) {
        return { success: false, error: 'कृपया ईमेल आणि पासवर्ड प्रविष्ट करा.' };
      }

      // Create session for user
      const existingShopsRaw = localStorage.getItem('moti_dukaan_shops');
      const existingShops: Shop[] = existingShopsRaw ? JSON.parse(existingShopsRaw) : [SEED_SHOP];
      const matchedShop = existingShops.find(s => s.email.toLowerCase() === email.toLowerCase()) || SEED_SHOP;

      const session: UserSession = {
        userId: 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
        name: matchedShop.ownerName,
        email: email,
        shop: matchedShop,
      };

      setUser(session);
      setShop(matchedShop);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'लॉगिन करताना त्रुटी आली.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    ownerName: string;
    shopName: string;
    mobile: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const newShop: Shop = {
        $id: 'shop_' + Date.now(),
        ownerUserId: 'user_' + Date.now(),
        shopName: data.shopName,
        ownerName: data.ownerName,
        mobile: data.mobile,
        email: data.email,
        address: 'महाराष्ट्र, भारत',
        lowStockAlertLimit: 5,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      };

      // Try Appwrite if configured
      const conn = await checkAppwriteConnection();
      if (conn.ok && import.meta.env.VITE_APPWRITE_PROJECT_ID !== 'moti-dukaan') {
        try {
          const appwriteUser = await account.create(
            'unique()',
            data.email,
            data.password,
            data.ownerName
          );
          await account.createEmailPasswordSession(data.email, data.password);
          newShop.ownerUserId = appwriteUser.$id;
          newShop.$id = appwriteUser.$id;
          await updateShop(newShop);
        } catch (appwriteErr: any) {
          console.warn('Appwrite account create failed, proceeding in local storage mode', appwriteErr);
        }
      }

      // Save locally
      await updateShop(newShop);

      const session: UserSession = {
        userId: newShop.ownerUserId,
        name: newShop.ownerName,
        email: newShop.email,
        shop: newShop,
      };

      setUser(session);
      setShop(newShop);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'नोंदणी करताना त्रुटी आली.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    const demoSession: UserSession = {
      userId: 'user_moti_demo',
      name: SEED_SHOP.ownerName,
      email: SEED_SHOP.email,
      shop: SEED_SHOP,
    };
    setUser(demoSession);
    setShop(SEED_SHOP);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoSession));
  };

  const logout = async () => {
    try {
      if (import.meta.env.VITE_APPWRITE_PROJECT_ID) {
        await account.deleteSession('current').catch(() => {});
      }
    } catch (e) {
      // ignore
    }
    setUser(null);
    setShop(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateShopData = async (shopData: Shop) => {
    const updated = await updateShop(shopData);
    setShop(updated);
    if (user) {
      const updatedSession = { ...user, shop: updated };
      setUser(updatedSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginDemo,
        logout,
        updateShopData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
