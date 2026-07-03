import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginApi, register as registerApi } from '@/api/auth';
import { LoginCredentials, RegisterCredentials } from '@/types/auth';
import { User } from '@/types/user';

const AUTH_STORAGE_KEY = '@restaurant_pos_auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setUser(JSON.parse(stored) as User);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginApi(credentials);
    setUser(response.user);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
    return response.user;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await registerApi(credentials);
    setUser(response.user);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
    return response.user;
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      const next = { ...prev, ...updates };
      void AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      updateUser,
      logout,
    }),
    [user, isLoading, login, register, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
