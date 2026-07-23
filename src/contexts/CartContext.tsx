import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { MenuItem } from '@/types/menu';

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  clearCart: () => void;
  getQuantity: (menuItemId: number) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  const addItem = useCallback((menuItem: MenuItem, quantity = 1) => {
    if (!menuItem.is_available) {
      return;
    }

    setItems((current) => {
      const existing = current.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return current.map((line) =>
          line.menuItem.id === menuItem.id
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [...current, { menuItem, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.menuItem.id !== menuItemId);
      }

      return current.map((line) =>
        line.menuItem.id === menuItemId ? { ...line, quantity } : line,
      );
    });
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setItems((current) => current.filter((line) => line.menuItem.id !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getQuantity = useCallback(
    (menuItemId: number) =>
      items.find((line) => line.menuItem.id === menuItemId)?.quantity ?? 0,
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((total, line) => total + line.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, line) => total + line.menuItem.price * line.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      getQuantity,
    }),
    [items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart, getQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
