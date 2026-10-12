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
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  itemCount: number;
  baseTotal: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
}

const DEFAULT_INITIAL_CART: CartItem[] = [
  {
    id: 'flat-tire-bike',
    name: 'Flat Tire / Puncture Repair',
    nameKey: 'services.items.flatTire',
    type: 'bike',
    icon: 'droplets',
    price: 150,
    eta: '15-25 min',
    quantity: 1,
  }
];

const CART_STORAGE_KEY = 'fixonroad_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return DEFAULT_INITIAL_CART;
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return DEFAULT_INITIAL_CART;
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
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
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
