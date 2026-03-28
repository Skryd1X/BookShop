import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  author: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem("bookshop-cart");
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    localStorage.setItem("bookshop-cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    addItem: (item) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.productId === item.productId);
        if (existing) {
          return current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry);
        }
        return [...current, { ...item, quantity: 1 }];
      });
    },
    updateQuantity: (productId, quantity) => {
      setItems((current) => current.map((entry) => entry.productId === productId ? { ...entry, quantity: Math.max(1, quantity) } : entry));
    },
    removeItem: (productId) => {
      setItems((current) => current.filter((entry) => entry.productId !== productId));
    },
    clearCart: () => setItems([]),
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
