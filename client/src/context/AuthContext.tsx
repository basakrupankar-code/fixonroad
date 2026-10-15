import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n';
import { safeFetch } from '../lib/api';

type User = {
  id: string;
  phone: string;
  name: string | null;
  role: 'customer' | 'mechanic';
  email?: string;
  username?: string;
  city?: string;
  age?: number;
  language?: string;
  isTwoFactorEnabled?: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUserData: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const userData = await safeFetch('/api/v1/me');
      setUser(userData);
      if (userData.language) {
        i18n.changeLanguage(userData.language);
      }
    } catch (error) {
      console.error('Failed to check auth', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (userData.language) {
      i18n.changeLanguage(userData.language);
    }
  };

  const logout = async () => {
    try {
      await safeFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    // Prevent dangling roadside breakdown states across sign-outs
    localStorage.removeItem('token');
    localStorage.removeItem('fixonroad_cart');
    localStorage.removeItem('user_address');
    localStorage.removeItem('user_city');
    localStorage.removeItem('user_coords');
    localStorage.removeItem('user_geofence');
    localStorage.removeItem('breakdown_address');
    localStorage.removeItem('active_order_id');
    localStorage.removeItem('active_order_code');
    localStorage.removeItem('last_order_id');
    localStorage.removeItem('last_order_code');
    sessionStorage.removeItem('fixonroad_pending_cart_intent');
    setUser(null);
  };

  const updateUserData = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
      if (data.language) {
        i18n.changeLanguage(data.language);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
