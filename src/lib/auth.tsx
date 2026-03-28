import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredToken, setStoredToken } from "@/api/client";
import type { UserProfile } from "@/types/store";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      setStoredToken("");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    if (token) {
      setStoredToken(token);
      query.delete("token");
      const next = `${window.location.pathname}${query.toString() ? `?${query.toString()}` : ""}`;
      window.history.replaceState({}, "", next);
    }
    refreshProfile();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const response = await api.login({ email, password });
      setStoredToken(response.token);
      setUser(response.user);
    },
    register: async (payload) => {
      const response = await api.register(payload);
      setStoredToken(response.token);
      setUser(response.user);
    },
    forgotPassword: async (email) => {
      const response = await api.forgotPassword({ email });
      return response.message;
    },
    refreshProfile,
    logout: () => {
      setStoredToken("");
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
