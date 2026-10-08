import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n';

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
      const response = await fetch('/api/v1/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        if (userData.language) {
          i18n.changeLanguage(userData.language);
        }
      } else {
        setUser(null);
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
      await fetch('/api/v1/me/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
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
