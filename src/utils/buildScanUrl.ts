/** Deep link scanned by the customer app camera. */
export function buildRestaurantScanUrl(scanCode: string): string {
  return `restaurant-pos://scan/${scanCode.trim().toUpperCase()}`;
}

export function buildTableScanUrl(scanCode: string, tableNumber: string): string {
  return `restaurant-pos://scan/${scanCode.trim().toUpperCase()}/table/${tableNumber.trim()}`;
}
