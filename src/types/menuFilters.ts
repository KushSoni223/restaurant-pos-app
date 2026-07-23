export type DietaryTag = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'SPICY';

export type MenuSortOption = 'default' | 'price_asc' | 'price_desc' | 'name';

export interface MenuItemFilters {
  availableOnly: boolean;
  featuredOnly: boolean;
  dietaryTags: DietaryTag[];
  maxPrice: number | null;
  sort: MenuSortOption;
}

export interface DietaryTagFacet {
  tag: DietaryTag;
  label: string;
  count: number;
}

export interface MenuFilterFacets {
  dietary_tags: DietaryTagFacet[];
  price_range: { min: number; max: number };
  featured_count: number;
  available_count: number;
  total_count: number;
}

export const DEFAULT_MENU_FILTERS: MenuItemFilters = {
  availableOnly: false,
  featuredOnly: false,
  dietaryTags: [],
  maxPrice: null,
  sort: 'default',
};

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  GLUTEN_FREE: 'Gluten-free',
  SPICY: 'Spicy',
};
