import type { MenuItem } from '@/types/menu';
import type { MenuItemFilters, MenuSortOption } from '@/types/menuFilters';

function sortMenuItems(items: MenuItem[], sort: MenuSortOption): MenuItem[] {
  if (sort === 'price_asc') {
    return [...items].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  }
  if (sort === 'price_desc') {
    return [...items].sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
  }
  if (sort === 'name') {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...items].sort((a, b) => a.id - b.id);
}

export function filterMenuItems(
  items: MenuItem[],
  filters: MenuItemFilters,
  options?: { categoryId?: number | null; searchQuery?: string },
): MenuItem[] {
  let result = items;

  if (options?.categoryId != null) {
    result = result.filter((item) => item.category_id === options.categoryId);
  }

  if (filters.availableOnly) {
    result = result.filter((item) => item.is_available);
  }

  if (filters.featuredOnly) {
    result = result.filter((item) => item.is_featured);
  }

  if (filters.dietaryTags.length > 0) {
    const required = new Set(filters.dietaryTags);
    result = result.filter((item) => {
      const tags = new Set((item.dietary_tags ?? []).map((tag) => tag.toUpperCase()));
      return [...required].every((tag) => tags.has(tag));
    });
  }

  if (filters.maxPrice != null) {
    result = result.filter((item) => item.price <= filters.maxPrice!);
  }

  const query = options?.searchQuery?.trim().toLowerCase() ?? '';
  if (query.length > 0) {
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }

  return sortMenuItems(result, filters.sort);
}

export function hasActiveMenuFilters(filters: MenuItemFilters): boolean {
  return (
    filters.availableOnly ||
    filters.featuredOnly ||
    filters.dietaryTags.length > 0 ||
    filters.maxPrice != null ||
    filters.sort !== 'default'
  );
}

export function buildMenuFilterQuery(filters: MenuItemFilters): string {
  const params = new URLSearchParams();
  if (filters.availableOnly) {
    params.set('available_only', 'true');
  }
  if (filters.featuredOnly) {
    params.set('featured_only', 'true');
  }
  if (filters.dietaryTags.length > 0) {
    params.set('dietary_tags', filters.dietaryTags.join(','));
  }
  if (filters.maxPrice != null) {
    params.set('max_price', String(filters.maxPrice));
  }
  if (filters.sort !== 'default') {
    params.set('sort', filters.sort);
  }
  const query = params.toString();
  return query ? `&${query}` : '';
}
