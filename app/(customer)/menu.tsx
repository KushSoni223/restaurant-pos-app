import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchMenuFilterFacets, fetchRestaurantMenu } from '@/api/menu';
import { listActiveOffers } from '@/api/offers';
import { getTaxSettings } from '@/api/tax';
import {
  CategoryChips,
  FeaturedItemCard,
  MenuFilterChips,
  MenuGreeting,
  MenuItemCard,
  MenuPromoBanner,
  MenuSearchBar,
  RestaurantBanner,
  RestaurantScanner,
  TablePickerModal,
  ViewFloorPlanButton,
  menuScreenStyles,
} from '@/components/customer';
import { colors } from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/hooks/useAuth';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { MenuCategory, MenuItem } from '@/types/menu';
import type { Offer } from '@/types/offer';
import type { MenuFilterFacets, MenuItemFilters } from '@/types/menuFilters';
import { DEFAULT_MENU_FILTERS } from '@/types/menuFilters';
import { filterMenuItems, hasActiveMenuFilters } from '@/utils/filterMenuItems';

export default function CustomerMenuScreen() {
  const { user } = useAuth();
  const {
    restaurant,
    table,
    isLoading: isRestaurantLoading,
    isResolving,
    resolveScan,
    clearRestaurant,
    setTable,
  } = useRestaurant();
  const { addItem, getQuantity, clearCart } = useCart();
  const { showSuccess, showError } = useToast();
  const { layoutParts, horizontalBleed } = useScreenLayout('tabHeaderless');
  const listRef = useRef<ScrollView>(null);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [menuFilters, setMenuFilters] = useState<MenuItemFilters>(DEFAULT_MENU_FILTERS);
  const [filterFacets, setFilterFacets] = useState<MenuFilterFacets | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const restaurantId = restaurant?.id;
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const handleRefresh = useCallback(async () => {
    if (restaurantId == null) {
      return;
    }
    setIsRefreshing(true);
    try {
      const menu = await fetchRestaurantMenu(restaurantId, { refresh: true });
      setCategories(menu.categories);
      setMenuItems(menu.items);
      try {
        setOffers(await listActiveOffers(restaurantId));
      } catch {
        setOffers([]);
      }
    } catch (error) {
      showErrorRef.current(
        'Menu unavailable',
        error instanceof Error ? error.message : 'Could not load this restaurant menu.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId == null) {
      setCategories([]);
      setMenuItems([]);
      setOffers([]);
      setIsMenuLoading(false);
      return;
    }

    let cancelled = false;
    setIsMenuLoading(true);
    setSearchQuery('');
    setSelectedCategoryId(null);
    setMenuFilters(DEFAULT_MENU_FILTERS);
    setShowFilters(false);

    void fetchRestaurantMenu(restaurantId)
      .then((menu) => {
        if (cancelled) {
          return;
        }
        setCategories(menu.categories);
        setMenuItems(menu.items);
        setIsMenuLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setIsMenuLoading(false);
        showErrorRef.current(
          'Menu unavailable',
          error instanceof Error ? error.message : 'Could not load this restaurant menu.',
        );
      });

    void listActiveOffers(restaurantId)
      .then((offerList) => {
        if (!cancelled) {
          setOffers(offerList);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([]);
        }
      });

    void getTaxSettings(restaurantId).catch(() => undefined);

    void fetchMenuFilterFacets(restaurantId)
      .then((facets) => {
        if (!cancelled) {
          setFilterFacets(facets);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFilterFacets(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const featuredItems = useMemo(
    () => menuItems.filter((item) => item.is_available && item.is_featured).slice(0, 4),
    [menuItems],
  );

  const filteredItems = useMemo(
    () =>
      filterMenuItems(menuItems, menuFilters, {
        categoryId: selectedCategoryId,
        searchQuery,
      }),
    [menuItems, menuFilters, selectedCategoryId, searchQuery],
  );

  const hasHomeFilters = hasActiveMenuFilters(menuFilters);

  const groupedSections = useMemo(() => {
    if (selectedCategoryId !== null || searchQuery.trim().length > 0 || hasHomeFilters) {
      return null;
    }
    return categories
      .map((category) => ({
        category,
        items: menuItems.filter((item) => item.category_id === category.id),
      }))
      .filter((section) => section.items.length > 0);
  }, [categories, menuItems, selectedCategoryId, searchQuery, hasHomeFilters]);

  const handleMenuFiltersChange = useCallback((next: MenuItemFilters) => {
    setMenuFilters(next);
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleCategorySelect = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleAddItem = (item: MenuItem) => {
    addItem(item);
    showSuccess('Added to cart', item.name);
  };

  const handleChangeRestaurant = async () => {
    clearCart();
    await clearRestaurant();
  };

  const handleSelectTable = async (selected: { id: number; number: string }) => {
    await setTable(selected);
    setShowFloorPlan(false);
    showSuccess('Table selected', `You're at table ${selected.number}`);
  };

  const handleScan = async (code: string, source: 'qr' | 'manual') => {
    try {
      clearCart();
      await resolveScan(code, source);
    } catch (error) {
      showError(
        'Scan failed',
        error instanceof Error ? error.message : 'Could not find that restaurant.',
      );
      throw error;
    }
  };

  if (isRestaurantLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return <RestaurantScanner onScan={handleScan} isResolving={isResolving} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[layoutParts.header, styles.stickyHeader]}>
        <MenuGreeting name={user?.name} />
        <MenuSearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            listRef.current?.scrollTo({ y: 0, animated: false });
          }}
          onClear={() => {
            setSearchQuery('');
            listRef.current?.scrollTo({ y: 0, animated: false });
          }}
          onFilterPress={() => setShowFilters((current) => !current)}
          filtersActive={hasHomeFilters}
          filtersOpen={showFilters}
        />
        <CategoryChips
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
        {showFilters ? (
          <MenuFilterChips
            facets={filterFacets}
            filters={menuFilters}
            onChange={handleMenuFiltersChange}
          />
        ) : null}
      </View>

      <ScrollView
        ref={listRef}
        style={styles.list}
        contentContainerStyle={layoutParts.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <RestaurantBanner restaurant={restaurant} onChange={handleChangeRestaurant} />
        <ViewFloorPlanButton onPress={() => setShowFloorPlan(true)} />

        {isMenuLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {selectedCategoryId === null && !searchQuery.trim() && offers[0] ? (
              <MenuPromoBanner offer={offers[0]} />
            ) : null}

            {featuredItems.length > 0 &&
            !searchQuery.trim() &&
            selectedCategoryId === null &&
            !hasHomeFilters ? (
              <View style={styles.featuredSection}>
                <Text style={menuScreenStyles.sectionTitle}>Popular picks</Text>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  directionalLockEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[horizontalBleed.content, styles.featuredRow]}
                  style={horizontalBleed.container}
                >
                  {featuredItems.map((item) => (
                    <FeaturedItemCard
                      key={item.id}
                      item={item}
                      onAdd={() => handleAddItem(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.listSection}>
              <View style={menuScreenStyles.sectionHeader}>
                <Text style={menuScreenStyles.sectionTitle}>
                  {selectedCategoryId === null
                    ? searchQuery.trim()
                      ? 'Search results'
                      : 'Full menu'
                    : categories.find((c) => c.id === selectedCategoryId)?.name ?? 'Menu'}
                </Text>
                <Text style={menuScreenStyles.sectionCount}>{filteredItems.length} items</Text>
              </View>

              {filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No dishes found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try another category, filter, or search term.
                  </Text>
                </View>
              ) : groupedSections ? (
                groupedSections.map((section) => (
                  <MenuSection
                    key={section.category.id}
                    category={section.category}
                    items={section.items}
                    getQuantity={getQuantity}
                    onAdd={handleAddItem}
                  />
                ))
              ) : (
                filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getQuantity(item.id)}
                    onAdd={() => handleAddItem(item)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <TablePickerModal
        visible={showFloorPlan}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        restaurantTagline={restaurant.tagline}
        initialTable={table}
        viewOnly
        requireSelection={false}
        onClose={() => setShowFloorPlan(false)}
        onConfirm={handleSelectTable}
        confirmLabel="Select table {table}"
      />
    </View>
  );
}

interface MenuSectionProps {
  category: MenuCategory;
  items: MenuItem[];
  getQuantity: (menuItemId: number) => number;
  onAdd: (item: MenuItem) => void;
}

function MenuSection({ category, items, getQuantity, onAdd }: MenuSectionProps) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category.name}</Text>
      {category.description ? (
        <Text style={styles.categoryDescription}>{category.description}</Text>
      ) : null}
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          quantity={getQuantity(item.id)}
          onAdd={() => onAdd(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 2,
  },
  loader: {
    marginTop: 40,
  },
  featuredSection: {
    marginBottom: 8,
  },
  featuredRow: {
    paddingBottom: 4,
  },
  listSection: {
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
