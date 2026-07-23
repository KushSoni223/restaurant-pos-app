import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { DietaryTag, MenuFilterFacets, MenuItemFilters } from '@/types/menuFilters';
import { DEFAULT_MENU_FILTERS } from '@/types/menuFilters';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface QuickFilter {
  key: string;
  label: string;
  icon: IoniconName;
  isActive: (filters: MenuItemFilters) => boolean;
  toggle: (filters: MenuItemFilters) => MenuItemFilters;
  isVisible?: (facets: MenuFilterFacets | null) => boolean;
}

interface MenuFilterChipsProps {
  facets: MenuFilterFacets | null;
  filters: MenuItemFilters;
  onChange: (filters: MenuItemFilters) => void;
}

function buildQuickFilters(facets: MenuFilterFacets | null): QuickFilter[] {
  const budgetCap =
    facets && facets.price_range.max > 15
      ? Math.min(15, facets.price_range.max)
      : null;

  return [
    {
      key: 'available',
      label: 'Available',
      icon: 'checkmark-circle-outline',
      isActive: (f) => f.availableOnly,
      toggle: (f) => ({ ...f, availableOnly: !f.availableOnly }),
      isVisible: (f) => (f?.available_count ?? 0) < (f?.total_count ?? 1),
    },
    {
      key: 'featured',
      label: 'Popular',
      icon: 'star-outline',
      isActive: (f) => f.featuredOnly,
      toggle: (f) => ({ ...f, featuredOnly: !f.featuredOnly }),
      isVisible: (f) => (f?.featured_count ?? 0) > 0,
    },
    {
      key: 'VEGETARIAN',
      label: 'Vegetarian',
      icon: 'leaf-outline',
      isActive: (f) => f.dietaryTags.includes('VEGETARIAN'),
      toggle: (f) => toggleDietaryTag(f, 'VEGETARIAN'),
      isVisible: (f) => hasDietaryTag(f, 'VEGETARIAN'),
    },
    {
      key: 'VEGAN',
      label: 'Vegan',
      icon: 'nutrition-outline',
      isActive: (f) => f.dietaryTags.includes('VEGAN'),
      toggle: (f) => toggleDietaryTag(f, 'VEGAN'),
      isVisible: (f) => hasDietaryTag(f, 'VEGAN'),
    },
    {
      key: 'GLUTEN_FREE',
      label: 'Gluten-free',
      icon: 'shield-checkmark-outline',
      isActive: (f) => f.dietaryTags.includes('GLUTEN_FREE'),
      toggle: (f) => toggleDietaryTag(f, 'GLUTEN_FREE'),
      isVisible: (f) => hasDietaryTag(f, 'GLUTEN_FREE'),
    },
    {
      key: 'SPICY',
      label: 'Spicy',
      icon: 'flame-outline',
      isActive: (f) => f.dietaryTags.includes('SPICY'),
      toggle: (f) => toggleDietaryTag(f, 'SPICY'),
      isVisible: (f) => hasDietaryTag(f, 'SPICY'),
    },
    {
      key: 'budget',
      label: budgetCap != null ? `Under $${budgetCap}` : 'Budget',
      icon: 'pricetag-outline',
      isActive: (f) => f.maxPrice != null,
      toggle: (f) => ({
        ...f,
        maxPrice: f.maxPrice == null && budgetCap != null ? budgetCap : null,
      }),
      isVisible: () => budgetCap != null,
    },
    {
      key: 'price_asc',
      label: 'Price ↑',
      icon: 'arrow-up-outline',
      isActive: (f) => f.sort === 'price_asc',
      toggle: (f) => ({
        ...f,
        sort: f.sort === 'price_asc' ? 'default' : 'price_asc',
      }),
    },
    {
      key: 'price_desc',
      label: 'Price ↓',
      icon: 'arrow-down-outline',
      isActive: (f) => f.sort === 'price_desc',
      toggle: (f) => ({
        ...f,
        sort: f.sort === 'price_desc' ? 'default' : 'price_desc',
      }),
    },
  ];
}

function hasDietaryTag(facets: MenuFilterFacets | null, tag: DietaryTag): boolean {
  return facets?.dietary_tags.some((entry) => entry.tag === tag && entry.count > 0) ?? false;
}

function toggleDietaryTag(filters: MenuItemFilters, tag: DietaryTag): MenuItemFilters {
  const hasTag = filters.dietaryTags.includes(tag);
  return {
    ...filters,
    dietaryTags: hasTag
      ? filters.dietaryTags.filter((entry) => entry !== tag)
      : [...filters.dietaryTags, tag],
  };
}

function isFilterActive(filters: MenuItemFilters): boolean {
  return (
    filters.availableOnly ||
    filters.featuredOnly ||
    filters.dietaryTags.length > 0 ||
    filters.maxPrice != null ||
    filters.sort !== 'default'
  );
}

export function MenuFilterChips({ facets, filters, onChange }: MenuFilterChipsProps) {
  const quickFilters = buildQuickFilters(facets).filter(
    (entry) => entry.isVisible?.(facets) ?? true,
  );

  if (quickFilters.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Filters</Text>
        {isFilterActive(filters) ? (
          <Pressable onPress={() => onChange(DEFAULT_MENU_FILTERS)} hitSlop={8}>
            <Text style={styles.clear}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
        style={styles.scroll}
      >
        {quickFilters.map((entry) => {
          const active = entry.isActive(filters);
          return (
            <Pressable
              key={entry.key}
              onPress={() => onChange(entry.toggle(filters))}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Ionicons
                name={entry.icon}
                size={14}
                color={active ? '#FFFFFF' : colors.primaryDark}
                style={styles.chipIcon}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {entry.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sectionGap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clear: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
