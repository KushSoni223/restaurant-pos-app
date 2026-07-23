export interface TaxSettings {
  id: number;
  restaurant_id: number;
  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  service_charge_enabled: boolean;
  service_charge_rate: number;
  service_charge_label: string;
  prices_include_tax: boolean;
}

export interface TaxSettingsUpdate {
  tax_enabled?: boolean;
  tax_rate?: number;
  tax_label?: string;
  service_charge_enabled?: boolean;
  service_charge_rate?: number;
  service_charge_label?: string;
  prices_include_tax?: boolean;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  taxLabel: string;
  serviceChargeLabel: string;
  showTax: boolean;
  showServiceCharge: boolean;
}
