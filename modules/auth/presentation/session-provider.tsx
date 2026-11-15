"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authGateway } from "../composition.client";
import type { SessionUser } from "../domain/user";

export interface SessionContext {
  user: SessionUser | null;
  /** true hasta resolver AuthGateway.me(). */
  loading: boolean;
  /** Lanza el error de la API (ApiError) si falla. */
  login(username: string, password: string): Promise<void>;
  register(username: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const Context = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Primer render siempre "sin sesión" (evita desajuste de hidratación).
  useEffect(() => {
    let active = true;
    authGateway
      .me()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setUser(await authGateway.login(username, password));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setUser(await authGateway.register(username, email, password));
  }, []);

  const signOut = useCallback(async () => {
    await authGateway.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, signOut }),
    [user, loading, login, register, signOut],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession(): SessionContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  return ctx;
}
