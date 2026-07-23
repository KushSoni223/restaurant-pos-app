import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listOrders, type ApiOrder, type ApiOrderStatus } from '@/api/orders';
import {
  EmptyState,
  OrderCard,
  OrderFilterChips,
  ScreenIntro,
  type OrderFilter,
} from '@/components/customer';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { CustomerOrder, OrderStatus } from '@/types/order';

const ACTIVE_STATUSES = new Set<CustomerOrder['status']>(['pending', 'preparing', 'ready']);
const PAST_STATUSES = new Set<CustomerOrder['status']>(['completed', 'cancelled']);

const STATUS_MAP: Record<ApiOrderStatus, OrderStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'completed',
  PAID: 'completed',
  CANCELLED: 'cancelled',
};

function toCustomerOrder(order: ApiOrder): CustomerOrder {
  return {
    id: String(order.id),
    orderNumber: `ORD-${order.id}`,
    status: STATUS_MAP[order.status],
    items: order.items.map((item) => ({
      name: item.menu_item_name ?? `Item ${item.menu_item_id}`,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
    total: Number(order.total),
    createdAt: order.created_at,
  };
}

function filterOrders(orders: CustomerOrder[], filter: OrderFilter): CustomerOrder[] {
  if (filter === 'active') {
    return orders.filter((order) => ACTIVE_STATUSES.has(order.status));
  }
  if (filter === 'completed') {
    return orders.filter((order) => PAST_STATUSES.has(order.status));
  }
  return orders;
}

export default function CustomerOrdersScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const { showError } = useToast();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const apiOrders = await listOrders(undefined, true);
      setOrders(apiOrders.map(toCustomerOrder));
    } catch (error) {
      showError(
        'Could not load orders',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    }
  }, [user, showError]);

  useEffect(() => {
    if (!isAuthLoading) {
      void loadOrders();
    }
  }, [isAuthLoading, loadOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const filteredOrders = useMemo(() => filterOrders(orders, filter), [orders, filter]);
  const activeCount = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.has(order.status)).length,
    [orders],
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title={`Orders, ${firstName}`}
          subtitle={
            activeCount > 0
              ? `${activeCount} active order${activeCount === 1 ? '' : 's'} in progress`
              : 'Track your past and current orders'
          }
          icon="receipt-outline"
        />
        <OrderFilterChips selected={filter} onSelect={setFilter} />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          layoutParts.scrollContent,
          filteredOrders.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No orders found"
            subtitle={
              filter === 'active'
                ? 'You have no active orders right now.'
                : filter === 'completed'
                  ? 'Your completed orders will appear here.'
                  : 'Place an order from the menu to see it here.'
            }
          />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filter === 'all' ? 'All orders' : filter === 'active' ? 'Active' : 'Past orders'}
              </Text>
              <Text style={styles.sectionCount}>{filteredOrders.length}</Text>
            </View>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/orders/[id]',
                    params: { id: order.id },
                  })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
