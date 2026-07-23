import { apiRequest } from './client';
import type { Restaurant } from '@/types/restaurant';

export async function scanRestaurant(scanCode: string): Promise<Restaurant> {
  const code = encodeURIComponent(scanCode.trim());
  return apiRequest<Restaurant>(`/api/v1/restaurants/scan/${code}`);
}

export async function listRestaurants(): Promise<Restaurant[]> {
  return apiRequest<Restaurant[]>('/api/v1/restaurants');
}

export async function listAllRestaurants(): Promise<Restaurant[]> {
  return apiRequest<Restaurant[]>('/api/v1/restaurants/all', {}, true);
}
