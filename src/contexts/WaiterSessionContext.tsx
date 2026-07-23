import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { listRestaurants } from '@/api/restaurants';
import type { Restaurant } from '@/types/restaurant';
import type { SelectedTable } from '@/types/table';

const RESTAURANT_KEY = '@waiter_selected_restaurant';
const TABLE_KEY = '@waiter_selected_table';

interface WaiterSessionContextValue {
  restaurant: Restaurant | null;
  table: SelectedTable | null;
  restaurants: Restaurant[];
  isLoading: boolean;
  setRestaurant: (restaurant: Restaurant | null) => Promise<void>;
  setTable: (table: SelectedTable | null) => Promise<void>;
  refreshRestaurants: () => Promise<void>;
}

const WaiterSessionContext = createContext<WaiterSessionContextValue | null>(null);

export function WaiterSessionProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurantState] = useState<Restaurant | null>(null);
  const [table, setTableState] = useState<SelectedTable | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRestaurants = useCallback(async () => {
    const list = await listRestaurants();
    setRestaurants(list);
    return list;
  }, []);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(RESTAURANT_KEY),
      AsyncStorage.getItem(TABLE_KEY),
      listRestaurants().catch(() => [] as Restaurant[]),
    ])
      .then(([storedRestaurant, storedTable, list]) => {
        setRestaurants(list);
        if (storedRestaurant) {
          const parsed = JSON.parse(storedRestaurant) as Restaurant;
          const match = list.find((item) => item.id === parsed.id);
          setRestaurantState(match ?? parsed);
        } else if (list.length === 1) {
          setRestaurantState(list[0]);
          void AsyncStorage.setItem(RESTAURANT_KEY, JSON.stringify(list[0]));
        }
        if (storedTable) {
          setTableState(JSON.parse(storedTable) as SelectedTable);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setRestaurant = useCallback(async (next: Restaurant | null) => {
    setRestaurantState(next);
    setTableState(null);
    await AsyncStorage.removeItem(TABLE_KEY);
    if (next) {
      await AsyncStorage.setItem(RESTAURANT_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(RESTAURANT_KEY);
    }
  }, []);

  const setTable = useCallback(async (next: SelectedTable | null) => {
    setTableState(next);
    if (next) {
      await AsyncStorage.setItem(TABLE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(TABLE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      restaurant,
      table,
      restaurants,
      isLoading,
      setRestaurant,
      setTable,
      refreshRestaurants,
    }),
    [restaurant, table, restaurants, isLoading, setRestaurant, setTable, refreshRestaurants],
  );

  return (
    <WaiterSessionContext.Provider value={value}>{children}</WaiterSessionContext.Provider>
  );
}

export function useWaiterSession() {
  const context = useContext(WaiterSessionContext);
  if (!context) {
    throw new Error('useWaiterSession must be used within WaiterSessionProvider');
  }
  return context;
}
