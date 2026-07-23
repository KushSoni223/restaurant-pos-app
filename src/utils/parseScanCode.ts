/** Extract restaurant scan code from QR payload. */
export function parseScanCode(raw: string): string {
  const trimmed = raw.trim();

  const schemeMatch = trimmed.match(/restaurant-pos:\/\/scan\/([^/?#]+)/i);
  if (schemeMatch) {
    return schemeMatch[1].toUpperCase();
  }

  const pathMatch = trimmed.match(/\/r\/([^/?#]+)/i);
  if (pathMatch) {
    return pathMatch[1].toUpperCase();
  }

  return trimmed.toUpperCase();
}
