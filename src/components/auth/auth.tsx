import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  email: string;
  role: "admin" | "operator";
  lastLogin: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "looksmax.auth.v1";

const ADMIN_CREDENTIALS = {
  email: "admin@looksmax.store",
  password: "mogger",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      login: (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !password) {
          return { ok: false, error: "Enter email + password." };
        }
        if (
          cleanEmail === ADMIN_CREDENTIALS.email &&
          password === ADMIN_CREDENTIALS.password
        ) {
          setUser({
            email: ADMIN_CREDENTIALS.email,
            role: "admin",
            lastLogin: new Date().toISOString(),
          });
          return { ok: true };
        }
        return { ok: false, error: "Invalid credentials." };
      },
      logout: () => setUser(null),
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
