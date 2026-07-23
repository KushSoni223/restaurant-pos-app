import { apiRequest } from './client';
import type { RestaurantTable, TableStatus } from '@/types/table';

const TABLE_CACHE_TTL_MS = 90_000;
const tableListCache = new Map<number, { data: RestaurantTable[]; expiresAt: number }>();

function getCachedTables(restaurantId: number): RestaurantTable[] | null {
  const entry = tableListCache.get(restaurantId);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) {
      tableListCache.delete(restaurantId);
    }
    return null;
  }
  return entry.data;
}

function setCachedTables(restaurantId: number, data: RestaurantTable[]): void {
  tableListCache.set(restaurantId, {
    data,
    expiresAt: Date.now() + TABLE_CACHE_TTL_MS,
  });
}

export function invalidateTablesCache(restaurantId?: number): void {
  if (restaurantId == null) {
    tableListCache.clear();
    return;
  }
  tableListCache.delete(restaurantId);
}

export async function getTable(tableId: number): Promise<RestaurantTable> {
  return apiRequest<RestaurantTable>(`/api/v1/tables/${tableId}`);
}

export async function listTables(
  restaurantId: number,
  options?: { sync?: boolean },
): Promise<RestaurantTable[]> {
  const sync = options?.sync === true;

  if (!sync) {
    const cached = getCachedTables(restaurantId);
    if (cached) {
      return cached;
    }
  }

  const syncQuery = sync ? '&sync=true' : '';
  const data = await apiRequest<RestaurantTable[]>(
    `/api/v1/tables?restaurant_id=${restaurantId}${syncQuery}`,
  );

  if (!sync) {
    setCachedTables(restaurantId, data);
  } else {
    setCachedTables(restaurantId, data);
  }

  return data;
}

export async function holdTable(tableId: number): Promise<RestaurantTable> {
  const table = await apiRequest<RestaurantTable>(`/api/v1/tables/${tableId}/hold`, {
    method: 'POST',
  });
  if (table.restaurant_id != null) {
    invalidateTablesCache(table.restaurant_id);
  }
  return table;
}

export async function updateTableStatus(
  tableId: number,
  status: TableStatus,
): Promise<void> {
  const table = await apiRequest<RestaurantTable>(
    `/api/v1/tables/${tableId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    true,
  );
  if (table.restaurant_id != null) {
    invalidateTablesCache(table.restaurant_id);
  }
}
