import { apiRequest } from './client';
import type { MenuCategory, MenuItem } from '@/types/menu';
import type { MenuFilterFacets, MenuItemFilters } from '@/types/menuFilters';
import { buildMenuFilterQuery } from '@/utils/filterMenuItems';

interface ApiMenuItem extends Omit<MenuItem, 'price'> {
  price: string | number;
}

export interface RestaurantMenu {
  categories: MenuCategory[];
  items: MenuItem[];
}

const MENU_CACHE_TTL_MS = 5 * 60_000;
const menuCache = new Map<number, { data: RestaurantMenu; expiresAt: number }>();
const facetsCache = new Map<number, { data: MenuFilterFacets; expiresAt: number }>();

function mapMenuItems(items: ApiMenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    price: Number(item.price),
    dietary_tags: item.dietary_tags ?? [],
    is_featured: item.is_featured ?? false,
  }));
}

function mapFilterFacets(facets: MenuFilterFacets): MenuFilterFacets {
  return {
    ...facets,
    price_range: {
      min: Number(facets.price_range.min),
      max: Number(facets.price_range.max),
    },
  };
}

export function invalidateRestaurantMenuCache(restaurantId?: number): void {
  if (restaurantId == null) {
    menuCache.clear();
    facetsCache.clear();
    return;
  }
  menuCache.delete(restaurantId);
  facetsCache.delete(restaurantId);
}

export async function fetchMenuFilterFacets(
  restaurantId: number,
  options?: { refresh?: boolean },
): Promise<MenuFilterFacets> {
  if (!options?.refresh) {
    const cached = facetsCache.get(restaurantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const facets = mapFilterFacets(
    await apiRequest<MenuFilterFacets>(`/api/v1/menu/filters?restaurant_id=${restaurantId}`),
  );
  facetsCache.set(restaurantId, { data: facets, expiresAt: Date.now() + MENU_CACHE_TTL_MS });
  return facets;
}

export async function fetchRestaurantMenu(
  restaurantId: number,
  options?: { refresh?: boolean; filters?: MenuItemFilters },
): Promise<RestaurantMenu> {
  const useCache = !options?.refresh && !options?.filters;
  if (useCache) {
    const cached = menuCache.get(restaurantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const filterQuery = options?.filters ? buildMenuFilterQuery(options.filters) : '';
  const bundle = await apiRequest<{ categories: MenuCategory[]; items: ApiMenuItem[] }>(
    `/api/v1/menu?restaurant_id=${restaurantId}${filterQuery}`,
  );

  const data: RestaurantMenu = {
    categories: bundle.categories,
    items: mapMenuItems(bundle.items),
  };

  if (!options?.filters) {
    menuCache.set(restaurantId, { data, expiresAt: Date.now() + MENU_CACHE_TTL_MS });
  }

  return data;
}

export async function listCategories(restaurantId: number): Promise<MenuCategory[]> {
  return apiRequest<MenuCategory[]>(`/api/v1/menu/categories?restaurant_id=${restaurantId}`);
}

export async function listMenuItems(
  restaurantId: number,
  filters?: MenuItemFilters,
): Promise<MenuItem[]> {
  const filterQuery = filters ? buildMenuFilterQuery(filters) : '';
  const items = await apiRequest<ApiMenuItem[]>(
    `/api/v1/menu/items?restaurant_id=${restaurantId}${filterQuery}`,
  );
  return mapMenuItems(items);
}

/** Admin / staff — all categories across restaurants. */
export async function listAllCategories(): Promise<MenuCategory[]> {
  return apiRequest<MenuCategory[]>('/api/v1/menu/categories');
}
