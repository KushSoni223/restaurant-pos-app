import type { TaxSettings } from '@/types/tax';

export function defaultTaxSettings(restaurantId: number): TaxSettings {
  return {
    id: 0,
    restaurant_id: restaurantId,
    tax_enabled: true,
    tax_rate: 0.08,
    tax_label: 'Sales Tax',
    service_charge_enabled: false,
    service_charge_rate: 0,
    service_charge_label: 'Service Charge',
    prices_include_tax: false,
  };
}
