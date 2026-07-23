import type { OrderTotals, TaxSettings } from '@/types/tax';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatRateLabel(label: string, rate: number): string {
  const percent = (rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1);
  return `${label} (${percent}%)`;
}

export function calculateOrderTotals(subtotal: number, settings: TaxSettings): OrderTotals {
  const tax = settings.tax_enabled ? roundMoney(subtotal * settings.tax_rate) : 0;
  const serviceCharge = settings.service_charge_enabled
    ? roundMoney(subtotal * settings.service_charge_rate)
    : 0;

  return {
    subtotal: roundMoney(subtotal),
    tax,
    serviceCharge,
    total: roundMoney(subtotal + tax + serviceCharge),
    taxLabel: formatRateLabel(settings.tax_label, settings.tax_rate),
    serviceChargeLabel: formatRateLabel(
      settings.service_charge_label,
      settings.service_charge_rate,
    ),
    showTax: settings.tax_enabled && tax > 0,
    showServiceCharge: settings.service_charge_enabled && serviceCharge > 0,
  };
}
