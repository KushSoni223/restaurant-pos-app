export interface MenuCategory {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  category_id: number;
  name: string;
  description?: string | null;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  dietary_tags?: string[];
  is_featured?: boolean;
  prep_time_minutes?: number | null;
}
