import { parseScanCode } from './parseScanCode';

export interface ScanPayload {
  restaurantCode: string;
  tableNumber?: string;
  tableId?: number;
}

/** Parse restaurant + optional table from QR or manual code. */
export function parseScanPayload(raw: string): ScanPayload {
  const trimmed = raw.trim();

  const tablePathMatch = trimmed.match(
    /restaurant-pos:\/\/scan\/([^/?#]+)\/table\/([^/?#]+)/i,
  );
  if (tablePathMatch) {
    return {
      restaurantCode: tablePathMatch[1].toUpperCase(),
      tableNumber: tablePathMatch[2],
    };
  }

  const schemeMatch = trimmed.match(/restaurant-pos:\/\/scan\/([^/?#]+)(?:\?(.+))?/i);
  if (schemeMatch) {
    const restaurantCode = schemeMatch[1].toUpperCase();
    const params = new URLSearchParams(schemeMatch[2] ?? '');
    const tableNumber = params.get('table') ?? params.get('table_number') ?? undefined;
    const tableIdRaw = params.get('table_id');
    const tableId = tableIdRaw ? Number(tableIdRaw) : undefined;
    return {
      restaurantCode,
      tableNumber: tableNumber ?? undefined,
      tableId: tableId && !Number.isNaN(tableId) ? tableId : undefined,
    };
  }

  const pipeMatch = trimmed.match(/^([A-Za-z0-9]+)[|:\-](\d+)$/);
  if (pipeMatch) {
    return {
      restaurantCode: pipeMatch[1].toUpperCase(),
      tableNumber: pipeMatch[2],
    };
  }

  return { restaurantCode: parseScanCode(trimmed) };
}
