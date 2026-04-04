import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiLogin, apiRegister, apiLogout, getStoredTokens } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      setState({ isAuthenticated: true, username: tokens.username, isLoading: false });
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }

    const handleForceLogout = () => {
      setState({ isAuthenticated: false, username: null, isLoading: false });
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin(username, password);
    setState({ isAuthenticated: true, username: tokens.username, isLoading: false });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const tokens = await apiRegister(username, password);
    setState({ isAuthenticated: true, username: tokens.username, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ isAuthenticated: false, username: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
