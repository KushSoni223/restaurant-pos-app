import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { createOrder } from '@/api/orders';
import { listTables } from '@/api/tables';
import { getTaxSettings } from '@/api/tax';
import {
  CartItemRow,
  CartSummaryCard,
  EmptyState,
  RestaurantBanner,
  RestaurantTableLayout,
  ScreenIntro,
  TablePickerModal,
} from '@/components/customer';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { RestaurantTable, SelectedTable } from '@/types/table';
import type { TaxSettings } from '@/types/tax';
import { calculateOrderTotals } from '@/utils/calculateOrderTotals';
import { defaultTaxSettings } from '@/utils/defaultTaxSettings';
import { formatPrice } from '@/utils/formatPrice';

export default function CustomerCartScreen() {
  const { user } = useAuth();
  const { restaurant, table, scanSource, setTable } = useRestaurant();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { showError, showSuccess } = useToast();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const [isPlacing, setIsPlacing] = useState(false);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const loadTaxSettings = useCallback(async () => {
    const restaurantId = restaurant?.id;
    if (restaurantId == null || items.length === 0) {
      setTaxSettings(null);
      return;
    }
    setIsTaxLoading(true);
    try {
      const settings = await getTaxSettings(restaurantId);
      setTaxSettings(settings);
    } catch {
      setTaxSettings(defaultTaxSettings(restaurantId));
    } finally {
      setIsTaxLoading(false);
    }
  }, [items.length, restaurant?.id]);

  const loadTables = useCallback(async () => {
    const restaurantId = restaurant?.id;
    if (restaurantId == null) {
      setTables([]);
      return;
    }
    setIsTablesLoading(true);
    try {
      const list = await listTables(restaurantId);
      setTables(list);
    } catch {
      setTables([]);
    } finally {
      setIsTablesLoading(false);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    loadTaxSettings();
    if (items.length > 0) {
      loadTables();
    } else {
      setTables([]);
    }
  }, [items.length, loadTaxSettings, loadTables]);

  const totals = useMemo(() => {
    const settings =
      taxSettings ?? defaultTaxSettings(restaurant?.id ?? 0);
    return calculateOrderTotals(subtotal, settings);
  }, [restaurant?.id, subtotal, taxSettings]);

  const handleChangeRestaurant = () => {
    router.push('/(customer)/menu');
  };

  const placeOrder = async (tableId: number, tableNumber?: string) => {
    if (!restaurant) {
      return;
    }
    setIsPlacing(true);
    try {
      await createOrder({
        restaurant_id: restaurant.id,
        table_id: tableId,
        customer_id: user?.id,
        items: items.map((line) => ({
          menu_item_id: line.menuItem.id,
          quantity: line.quantity,
        })),
      });
      showSuccess(
        'Order placed',
        `Table ${tableNumber ?? table?.number ?? tableId} · sent to the kitchen.`,
      );
      clearCart();
      router.push('/(customer)/orders');
    } catch (error) {
      showError(
        'Order failed',
        error instanceof Error ? error.message : 'Could not reach the kitchen. Try again.',
      );
    } finally {
      setIsPlacing(false);
    }
  };

  const handleBlueprintSelect = async (selected: RestaurantTable) => {
    const isCurrentTable = table?.id === selected.id;
    if (selected.status !== 'AVAILABLE' && !isCurrentTable) {
      return;
    }
    await setTable({ id: selected.id, number: selected.number });
  };

  const handleCheckoutPress = () => {
    if (!restaurant) {
      showError('No restaurant', 'Scan a restaurant QR code before placing an order.');
      return;
    }
    if (table) {
      placeOrder(table.id, table.number);
      return;
    }
    setShowTablePicker(true);
  };

  const handleTableConfirm = async (selected: SelectedTable) => {
    await setTable(selected);
    setShowTablePicker(false);
    await placeOrder(selected.id, selected.number);
  };

  const checkoutLabel = table
    ? `Place order · ${formatPrice(totals.total)}`
    : 'Select table';

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title="Your cart"
          subtitle={
            itemCount > 0
              ? `${itemCount} item${itemCount === 1 ? '' : 's'} ready to order`
              : 'Add dishes from the menu to get started'
          }
          icon="cart-outline"
          action={
            itemCount === 0
              ? { label: 'Browse menu', onPress: () => router.push('/(customer)/menu') }
              : undefined
          }
        />
        {restaurant ? (
          <RestaurantBanner restaurant={restaurant} onChange={handleChangeRestaurant} />
        ) : null}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          layoutParts.scrollContent,
          items.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Explore the menu and add your favorite dishes. They'll show up here."
            actionLabel="Go to menu"
            onAction={() => router.push('/(customer)/menu')}
          />
        ) : (
          <>
            {restaurant ? (
              <View style={styles.blueprintSection}>
                <Text style={styles.sectionTitle}>Floor blueprint</Text>
                <Text style={styles.blueprintHint}>
                  Tap your table on the plan{table ? ` · Table ${table.number} selected` : ''}
                </Text>
                {isTablesLoading ? (
                  <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                  <RestaurantTableLayout
                    tables={tables}
                    restaurantName={restaurant.name}
                    restaurantTagline={restaurant.tagline}
                    selectedTableId={table?.id}
                    onSelect={handleBlueprintSelect}
                  />
                )}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((line) => (
              <CartItemRow
                key={line.menuItem.id}
                line={line}
                onIncrease={() => updateQuantity(line.menuItem.id, line.quantity + 1)}
                onDecrease={() => updateQuantity(line.menuItem.id, line.quantity - 1)}
                onRemove={() => removeItem(line.menuItem.id)}
              />
            ))}
            <CartSummaryCard
              totals={totals}
              onCheckout={handleCheckoutPress}
              checkoutLabel={checkoutLabel}
              disabled={items.length === 0 || isPlacing || isTaxLoading}
            />
          </>
        )}
      </ScrollView>

      {restaurant ? (
        <TablePickerModal
          visible={showTablePicker}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantTagline={restaurant.tagline}
          initialTable={scanSource === 'qr' ? table : null}
          requireSelection={scanSource !== 'qr' || !table}
          onClose={() => setShowTablePicker(false)}
          onConfirm={handleTableConfirm}
          confirmLabel="Select table {table}"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  blueprintSection: {
    marginBottom: spacing.sectionGap,
  },
  blueprintHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: -4,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
