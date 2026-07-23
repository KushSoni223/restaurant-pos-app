export interface Restaurant {
  id: number;
  name: string;
  scan_code: string;
  tagline?: string | null;
  is_active: boolean;
}
