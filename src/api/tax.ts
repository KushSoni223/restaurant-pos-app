import { apiRequest } from './client';
import type { TaxSettings, TaxSettingsUpdate } from '@/types/tax';
import { defaultTaxSettings } from '@/utils/defaultTaxSettings';

interface ApiTaxSettings extends Omit<TaxSettings, 'tax_rate' | 'service_charge_rate'> {
  tax_rate: string | number;
  service_charge_rate: string | number;
}

const TAX_CACHE_TTL_MS = 5 * 60_000;
const taxCache = new Map<number, { data: TaxSettings; expiresAt: number }>();

function normalizeTaxSettings(settings: ApiTaxSettings): TaxSettings {
  return {
    ...settings,
    tax_rate: Number(settings.tax_rate),
    service_charge_rate: Number(settings.service_charge_rate),
  };
}

export function invalidateTaxSettingsCache(restaurantId?: number): void {
  if (restaurantId == null) {
    taxCache.clear();
    return;
  }
  taxCache.delete(restaurantId);
}

export async function getTaxSettings(
  restaurantId: number,
  options?: { refresh?: boolean; allowFallback?: boolean },
): Promise<TaxSettings> {
  if (!options?.refresh) {
    const cached = taxCache.get(restaurantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  try {
    const settings = await apiRequest<ApiTaxSettings>(
      `/api/v1/tax/settings?restaurant_id=${restaurantId}`,
    );
    const normalized = normalizeTaxSettings(settings);
    taxCache.set(restaurantId, {
      data: normalized,
      expiresAt: Date.now() + TAX_CACHE_TTL_MS,
    });
    return normalized;
  } catch (error) {
    if (options?.allowFallback === false) {
      throw error;
    }
    const fallback = defaultTaxSettings(restaurantId);
    taxCache.set(restaurantId, {
      data: fallback,
      expiresAt: Date.now() + 60_000,
    });
    return fallback;
  }
}

export async function updateTaxSettings(
  restaurantId: number,
  payload: TaxSettingsUpdate,
): Promise<TaxSettings> {
  const settings = await apiRequest<ApiTaxSettings>(
    `/api/v1/tax/settings?restaurant_id=${restaurantId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true,
  );
  const normalized = normalizeTaxSettings(settings);
  taxCache.set(restaurantId, {
    data: normalized,
    expiresAt: Date.now() + TAX_CACHE_TTL_MS,
  });
  return normalized;
}
