import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  nameKey?: string;
  type?: 'bike' | 'car';
  price: number;
  eta?: string;
  note?: string;
  noteKey?: string;
  icon?: string;
  quantity?: number;
  unit?: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addToCart: (item: CartItem) => void;
  removeItem: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getCartTotal: () => number;
  hydratePendingIntent: () => boolean;
  itemCount: number;
  baseTotal: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
}

const CART_STORAGE_KEY = 'fixonroad_cart';
export const PENDING_CART_INTENT_KEY = 'fixonroad_pending_cart_intent';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      // If user is not authenticated or is a mechanic, cart is not loaded
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });

  // When auth changes: if unauthenticated or logged in as mechanic, wipe cart state
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'mechanic') {
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      if (user?.role === 'mechanic') {
        sessionStorage.removeItem(PENDING_CART_INTENT_KEY);
      }
    }
  }, [isAuthenticated, user?.role]);

  // Persist items to localStorage only if authenticated as a customer
  useEffect(() => {
    try {
      if (isAuthenticated && user?.role !== 'mechanic') {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items, isAuthenticated, user?.role]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const isMulti = item.id.includes('fuel') || item.unit === 'liters';
        if (isMulti) {
          const updated = [...prev];
          const curr = updated[existingIndex];
          updated[existingIndex] = {
            ...curr,
            quantity: Math.min((curr.quantity || 1) + (item.quantity || 1), 20),
          };
          return updated;
        }
        return prev;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    addItem(item);
  }, [addItem]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    removeItem(id);
  }, [removeItem]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const currentQty = item.quantity || 1;
          const nextQty = currentQty + delta;
          if (nextQty <= 0) return null;
          return { ...item, quantity: Math.min(20, nextQty) };
        })
        .filter((item): item is CartItem => item !== null)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const isInCart = useCallback((id: string) => {
    return items.some((item) => item.id === id);
  }, [items]);

  // Hydrate pending roadside assistance intent from sessionStorage
  const hydratePendingIntent = useCallback((): boolean => {
    try {
      const raw = sessionStorage.getItem(PENDING_CART_INTENT_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.service) {
        addItem({
          ...parsed.service,
          quantity: parsed.service.quantity || 1,
        });

        if (parsed.address) {
          localStorage.setItem('user_address', parsed.address);
          localStorage.setItem('breakdown_address', parsed.address);
        }
        if (parsed.coords) {
          localStorage.setItem('user_coords', JSON.stringify(parsed.coords));
        }

        sessionStorage.removeItem(PENDING_CART_INTENT_KEY);
        return true;
      }
    } catch (e) {
      console.error('Failed to hydrate pending cart intent:', e);
      sessionStorage.removeItem(PENDING_CART_INTENT_KEY);
    }
    return false;
  }, [addItem]);

  // Automatically attempt hydration if user logs in as customer
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'mechanic') {
      hydratePendingIntent();
    }
  }, [isAuthenticated, user?.role, hydratePendingIntent]);

  const itemCount = items.reduce((count, item) => count + (item.quantity || 1), 0);
  const baseTotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const platformFee = items.length > 0 ? 10 : 0;
  const gst = Math.round(baseTotal * 0.18);
  const totalAmount = baseTotal + gst + platformFee;

  const getCartTotal = () => totalAmount;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addToCart,
        removeItem,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getCartTotal,
        hydratePendingIntent,
        itemCount,
        baseTotal,
        platformFee,
        gst,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
