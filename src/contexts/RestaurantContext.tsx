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

import { getTable, holdTable, listTables } from '@/api/tables';
import { scanRestaurant } from '@/api/restaurants';
import { parseScanPayload } from '@/utils/parseScanPayload';
import type { Restaurant } from '@/types/restaurant';
import type { SelectedTable } from '@/types/table';

const RESTAURANT_STORAGE_KEY = '@restaurant_pos_selected_restaurant';
const TABLE_STORAGE_KEY = '@restaurant_pos_selected_table';
const SCAN_SOURCE_STORAGE_KEY = '@restaurant_pos_scan_source';

export type ScanSource = 'qr' | 'manual';

interface RestaurantSession {
  restaurant: Restaurant | null;
  table: SelectedTable | null;
  scanSource: ScanSource | null;
}

interface RestaurantContextValue extends RestaurantSession {
  isLoading: boolean;
  isResolving: boolean;
  resolveScan: (rawCode: string, source?: ScanSource) => Promise<Restaurant>;
  setTable: (table: SelectedTable | null) => Promise<void>;
  clearRestaurant: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

async function matchTableFromPayload(
  restaurantId: number,
  tableNumber?: string,
  tableId?: number,
): Promise<SelectedTable | null> {
  if (tableId != null) {
    try {
      const table = await getTable(tableId);
      if (table.restaurant_id !== restaurantId) {
        return null;
      }
      return { id: table.id, number: table.number };
    } catch {
      return null;
    }
  }

  if (!tableNumber) {
    return null;
  }

  const tables = await listTables(restaurantId);
  const matched = tables.find((table) => table.number === tableNumber);
  return matched ? { id: matched.id, number: matched.number } : null;
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTableState] = useState<SelectedTable | null>(null);
  const [scanSource, setScanSource] = useState<ScanSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(RESTAURANT_STORAGE_KEY),
      AsyncStorage.getItem(TABLE_STORAGE_KEY),
      AsyncStorage.getItem(SCAN_SOURCE_STORAGE_KEY),
    ])
      .then(([storedRestaurant, storedTable, storedSource]) => {
        if (storedRestaurant) {
          setRestaurant(JSON.parse(storedRestaurant) as Restaurant);
        }
        if (storedTable) {
          setTableState(JSON.parse(storedTable) as SelectedTable);
        }
        if (storedSource === 'qr' || storedSource === 'manual') {
          setScanSource(storedSource);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persistRestaurant = useCallback(async (next: Restaurant | null) => {
    setRestaurant(next);
    if (next) {
      await AsyncStorage.setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(next));
    } else {
      await AsyncStorage.removeItem(RESTAURANT_STORAGE_KEY);
    }
  }, []);

  const setTable = useCallback(async (next: SelectedTable | null) => {
    setTableState(next);
    if (next) {
      await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(next));
      try {
        await holdTable(next.id);
      } catch {
        // Floor plan still works if hold fails.
      }
    } else {
      await AsyncStorage.removeItem(TABLE_STORAGE_KEY);
    }
  }, []);

  const persistScanSource = useCallback(async (next: ScanSource | null) => {
    setScanSource(next);
    if (next) {
      await AsyncStorage.setItem(SCAN_SOURCE_STORAGE_KEY, next);
    } else {
      await AsyncStorage.removeItem(SCAN_SOURCE_STORAGE_KEY);
    }
  }, []);

  const resolveScan = useCallback(
    async (rawCode: string, source: ScanSource = 'qr') => {
      setIsResolving(true);
      try {
        const payload = parseScanPayload(rawCode);
        const resolved = await scanRestaurant(payload.restaurantCode);
        await persistRestaurant(resolved);
        await persistScanSource(source);

        if (source !== 'qr') {
          await setTable(null);
        } else if (payload.tableNumber || payload.tableId != null) {
          // Match table in background so the menu can load immediately.
          void matchTableFromPayload(
            resolved.id,
            payload.tableNumber,
            payload.tableId,
          )
            .then((matched) => {
              if (matched) {
                void setTable(matched);
              }
            })
            .catch(() => undefined);
        } else {
          await setTable(null);
        }

        return resolved;
      } finally {
        setIsResolving(false);
      }
    },
    [persistRestaurant, persistScanSource, setTable],
  );

  const clearRestaurant = useCallback(async () => {
    await persistRestaurant(null);
    await setTable(null);
    await persistScanSource(null);
  }, [persistRestaurant, persistScanSource, setTable]);

  const value = useMemo(
    () => ({
      restaurant,
      table,
      scanSource,
      isLoading,
      isResolving,
      resolveScan,
      setTable,
      clearRestaurant,
    }),
    [restaurant, table, scanSource, isLoading, isResolving, resolveScan, setTable, clearRestaurant],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
}
