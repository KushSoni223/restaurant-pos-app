import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginApi, register as registerApi } from '@/api/auth';
import { authToken } from '@/api/authToken';
import { LoginCredentials, RegisterCredentials } from '@/types/auth';
import { User } from '@/types/user';

const AUTH_STORAGE_KEY = '@restaurant_pos_auth';
const TOKEN_STORAGE_KEY = '@restaurant_pos_token';

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
    Promise.all([AsyncStorage.getItem(AUTH_STORAGE_KEY), AsyncStorage.getItem(TOKEN_STORAGE_KEY)])
      .then(([storedUser, storedToken]) => {
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser) as User);
          authToken.set(storedToken);
        } else if (storedUser || storedToken) {
          void AsyncStorage.multiRemove([AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY]);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persistSession = useCallback(async (nextUser: User, token: string | null | undefined) => {
    setUser(nextUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    if (token) {
      authToken.set(token);
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginApi(credentials);
    await persistSession(response.user, response.token);
    return response.user;
  }, [persistSession]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await registerApi(credentials);
    await persistSession(response.user, response.token);
    return response.user;
  }, [persistSession]);

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
    authToken.set(null);
    await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, TOKEN_STORAGE_KEY]);
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
