import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listCategories, listMenuItems } from '@/api/menu';
import { createOrder } from '@/api/orders';
import { getTaxSettings } from '@/api/tax';
import { CategoryChips, MenuItemCard, ScreenIntro } from '@/components/customer';
import { Button } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useWaiterSession } from '@/contexts/WaiterSessionContext';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { MenuCategory, MenuItem } from '@/types/menu';
import type { TaxSettings } from '@/types/tax';
import { calculateOrderTotals } from '@/utils/calculateOrderTotals';
import { formatPrice } from '@/utils/formatPrice';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

export default function WaiterTakeOrderScreen() {
  const { user } = useAuth();
  const { restaurant, table } = useWaiterSession();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const loadMenu = useCallback(async () => {
    if (!restaurant) {
      return;
    }
    setIsLoading(true);
    try {
      const [categoryList, itemList, tax] = await Promise.all([
        listCategories(restaurant.id),
        listMenuItems(restaurant.id),
        getTaxSettings(restaurant.id),
      ]);
      setCategories(categoryList);
      setMenuItems(itemList);
      setTaxSettings(tax);
      setSelectedCategoryId(null);
    } catch (error) {
      showError(
        'Menu unavailable',
        error instanceof Error ? error.message : 'Could not load menu items.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurant, showError]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) {
      return menuItems;
    }
    return menuItems.filter((item) => item.category_id === selectedCategoryId);
  }, [menuItems, selectedCategoryId]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [cart],
  );

  const totals = useMemo(() => {
    if (!taxSettings) {
      return calculateOrderTotals(subtotal, {
        id: 0,
        restaurant_id: restaurant?.id ?? 0,
        tax_enabled: true,
        tax_rate: 0.08,
        tax_label: 'Sales Tax',
        service_charge_enabled: false,
        service_charge_rate: 0,
        service_charge_label: 'Service Charge',
        prices_include_tax: false,
      });
    }
    return calculateOrderTotals(subtotal, taxSettings);
  }, [restaurant?.id, subtotal, taxSettings]);

  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const getQuantity = (itemId: number) =>
    cart.find((line) => line.item.id === itemId)?.quantity ?? 0;

  const updateQuantity = (item: MenuItem, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.item.id !== item.id);
      }
      const existing = current.find((line) => line.item.id === item.id);
      if (existing) {
        return current.map((line) =>
          line.item.id === item.id ? { ...line, quantity } : line,
        );
      }
      return [...current, { item, quantity }];
    });
  };

  const handlePlaceOrder = async () => {
    if (!restaurant || !table || !user) {
      showError('Missing details', 'Select a restaurant and table before placing an order.');
      return;
    }
    if (cart.length === 0) {
      showError('Empty order', 'Add at least one menu item.');
      return;
    }

    setIsPlacing(true);
    try {
      await createOrder(
        {
          restaurant_id: restaurant.id,
          table_id: table.id,
          waiter_id: user.id,
          items: cart.map((line) => ({
            menu_item_id: line.item.id,
            quantity: line.quantity,
          })),
        },
        true,
      );
      setCart([]);
      showSuccess('Order sent', `Table ${table.number} order sent to the kitchen.`);
    } catch (error) {
      showError(
        'Order failed',
        error instanceof Error ? error.message : 'Could not place the order.',
      );
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title="Take order"
          subtitle={
            table
              ? `Table ${table.number} · ${restaurant?.name ?? 'Restaurant'}`
              : 'Select a table on the Tables tab first'
          }
          icon="add-circle-outline"
        />
        {restaurant && table && !isLoading ? (
          <CategoryChips
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        ) : null}
      </View>

      {!table || !restaurant ? (
        <View style={[styles.emptyState, layoutParts.scrollContent]}>
          <Text style={styles.emptyTitle}>No table selected</Text>
          <Text style={styles.emptySubtitle}>
            Go to Tables, tap a table on the floor plan, then return here to add items.
          </Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <ScrollView
            style={styles.list}
            contentContainerStyle={layoutParts.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={getQuantity(item.id)}
                onAdd={() => updateQuantity(item, getQuantity(item.id) + 1)}
              />
            ))}
          </ScrollView>

          <View style={[styles.footer, layoutParts.scrollContent]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{itemCount} items</Text>
              <Text style={styles.summaryTotal}>{formatPrice(totals.total)}</Text>
            </View>
            <Button
              title={`Send to kitchen · ${formatPrice(totals.total)}`}
              onPress={handlePlaceOrder}
              disabled={cart.length === 0 || isPlacing}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: { marginTop: spacing.xxl },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: { flex: 1 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
