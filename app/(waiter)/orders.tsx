import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listOrders, updateOrderStatus, type ApiOrder, type ApiOrderStatus } from '@/api/orders';
import { EmptyState, ScreenIntro } from '@/components/customer';
import { menuCardStyles } from '@/components/customer/menuStyles';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useWaiterSession } from '@/contexts/WaiterSessionContext';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import { formatPrice } from '@/utils/formatPrice';

const ACTIVE_STATUSES = new Set<ApiOrderStatus>(['PENDING', 'CONFIRMED', 'PREPARING', 'READY']);

const STATUS_CONFIG: Record<
  ApiOrderStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: { label: 'Pending', color: '#B45309', bg: colors.primaryLight, icon: 'time-outline' },
  CONFIRMED: { label: 'Confirmed', color: '#B45309', bg: colors.primaryLight, icon: 'checkmark-outline' },
  PREPARING: { label: 'Preparing', color: '#B45309', bg: colors.primaryLight, icon: 'flame-outline' },
  READY: { label: 'Ready', color: colors.success, bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  SERVED: { label: 'Served', color: colors.textMuted, bg: '#F3F4F6', icon: 'restaurant-outline' },
  PAID: { label: 'Paid', color: colors.textMuted, bg: '#F3F4F6', icon: 'checkmark-done-outline' },
  CANCELLED: { label: 'Cancelled', color: colors.error, bg: '#FEF2F2', icon: 'close-circle-outline' },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function WaiterOrdersScreen() {
  const { restaurant } = useWaiterSession();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const { showError, showSuccess } = useToast();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    if (!restaurant) {
      setOrders([]);
      return;
    }
    setIsLoading(true);
    try {
      const list = await listOrders({ restaurantId: restaurant.id }, true);
      setOrders(list.filter((order) => ACTIVE_STATUSES.has(order.status)));
    } catch (error) {
      showError(
        'Could not load orders',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurant, showError]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const handleMarkServed = async (order: ApiOrder) => {
    setUpdatingOrderId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, 'SERVED', true);
      setOrders((current) => current.filter((item) => item.id !== updated.id));
      showSuccess('Order served', `Order #${order.id} marked as served.`);
    } catch (error) {
      showError(
        'Update failed',
        error instanceof Error ? error.message : 'Could not update the order.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [orders],
  );

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title="Active orders"
          subtitle={
            restaurant
              ? `${sortedOrders.length} in progress · ${restaurant.name}`
              : 'Select a restaurant on the Tables tab'
          }
          icon="list-outline"
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          layoutParts.scrollContent,
          sortedOrders.length === 0 && styles.emptyContent,
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
        {!restaurant ? (
          <EmptyState
            icon="list-outline"
            title="No restaurant selected"
            subtitle="Choose a restaurant on the Tables tab to view orders."
          />
        ) : isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : sortedOrders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No active orders"
            subtitle="New orders will appear here automatically."
          />
        ) : (
          sortedOrders.map((order) => {
            const status = STATUS_CONFIG[order.status];
            const itemSummary = order.items
              .map((item) => `${item.quantity}× ${item.menu_item_name ?? 'Item'}`)
              .join(', ');
            const canServe = order.status === 'READY';

            return (
              <View key={order.id} style={[menuCardStyles.card, styles.card]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Order #{order.id}</Text>
                    <Text style={styles.meta}>
                      {formatTime(order.created_at)}
                      {order.table_number ? ` · Table ${order.table_number}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon} size={14} color={status.color} />
                    <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <Text style={styles.items} numberOfLines={2}>
                  {itemSummary}
                </Text>

                <View style={styles.footer}>
                  <Text style={styles.total}>{formatPrice(Number(order.total))}</Text>
                  {canServe ? (
                    <Pressable
                      onPress={() => handleMarkServed(order)}
                      disabled={updatingOrderId === order.id}
                      style={[
                        styles.actionButton,
                        updatingOrderId === order.id && styles.actionButtonDisabled,
                      ]}
                    >
                      <Text style={styles.actionText}>
                        {updatingOrderId === order.id ? 'Updating…' : 'Mark served'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.waitingText}>Waiting for kitchen</Text>
                  )}
                </View>
              </View>
            );
          })
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
  list: { flex: 1 },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loader: { marginVertical: spacing.xxl },
  card: {
    padding: spacing.cardInner,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  items: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  total: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  waitingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
