import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  itemCount: number;
  baseTotal: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
}

const CART_STORAGE_KEY = 'fixonroad_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
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

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addItem = (item: CartItem) => {
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
  };

  const addToCart = (item: CartItem) => {
    addItem(item);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeFromCart = (id: string) => {
    removeItem(id);
  };

  const updateQuantity = (id: string, delta: number) => {
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
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (id: string) => {
    return items.some((item) => item.id === id);
  };

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
