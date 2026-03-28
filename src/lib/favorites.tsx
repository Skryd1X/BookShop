import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/types/store";

interface FavoritesContextValue {
  items: Product[];
  ids: string[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFavorites = async () => {
    if (!user || user.role !== "customer") {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const nextItems = await api.getFavorites();
      setItems(nextItems);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, [user?.id]);

  const value = useMemo<FavoritesContextValue>(() => ({
    items,
    ids: items.map((item) => item.id),
    loading,
    isFavorite: (productId) => items.some((item) => item.id === productId),
    toggleFavorite: async (product) => {
      const response = await api.toggleFavorite(product.id);
      setItems((current) => response.active
        ? current.some((item) => item.id === product.id) ? current : [product, ...current]
        : current.filter((item) => item.id !== product.id));
      return response.active;
    },
    refreshFavorites,
  }), [items, loading, user?.id]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }
  return context;
}
