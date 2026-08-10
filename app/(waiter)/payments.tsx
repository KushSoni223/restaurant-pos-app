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

import { listOrders, updateOrderStatus, type ApiOrder } from '@/api/orders';
import { EmptyState, ScreenIntro } from '@/components/customer';
import { menuCardStyles } from '@/components/customer/menuStyles';
import { Button } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useWaiterSession } from '@/contexts/WaiterSessionContext';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useLogout } from '@/hooks/useLogout';
import { useToast } from '@/hooks/useToast';
import { formatPrice } from '@/utils/formatPrice';

const BILL_STATUSES = new Set(['READY', 'SERVED']);

export default function WaiterPaymentsScreen() {
  const { restaurant } = useWaiterSession();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const handleLogout = useLogout();
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
      setOrders(list.filter((order) => BILL_STATUSES.has(order.status)));
    } catch (error) {
      showError(
        'Could not load bills',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [restaurant, showError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const handleMarkPaid = async (order: ApiOrder) => {
    setUpdatingOrderId(order.id);
    try {
      await updateOrderStatus(order.id, 'PAID', true);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      showSuccess('Payment recorded', `Order #${order.id} marked as paid.`);
    } catch (error) {
      showError(
        'Payment failed',
        error instanceof Error ? error.message : 'Could not mark the order as paid.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const totalDue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total), 0),
    [orders],
  );

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title="Payments"
          subtitle={
            restaurant
              ? `${orders.length} open bill${orders.length === 1 ? '' : 's'} · ${formatPrice(totalDue)} due`
              : 'Select a restaurant on the Tables tab'
          }
          icon="card-outline"
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          layoutParts.scrollContent,
          orders.length === 0 && !isLoading && styles.emptyContent,
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
            icon="card-outline"
            title="No restaurant selected"
            subtitle="Choose a restaurant on the Tables tab to view bills."
          />
        ) : isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="No bills waiting"
            subtitle="Orders ready for payment will appear here."
          />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={[menuCardStyles.card, styles.card]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>Order #{order.id}</Text>
                  <Text style={styles.meta}>
                    {order.table_number ? `Table ${order.table_number}` : 'No table'}
                    {' · '}
                    {order.status.toLowerCase()}
                  </Text>
                </View>
                <Text style={styles.total}>{formatPrice(Number(order.total))}</Text>
              </View>
              <Text style={styles.items} numberOfLines={2}>
                {order.items
                  .map((item) => `${item.quantity}× ${item.menu_item_name ?? 'Item'}`)
                  .join(', ')}
              </Text>
              <Pressable
                onPress={() => handleMarkPaid(order)}
                disabled={updatingOrderId === order.id}
                style={[
                  styles.payButton,
                  updatingOrderId === order.id && styles.payButtonDisabled,
                ]}
              >
                <Text style={styles.payButtonText}>
                  {updatingOrderId === order.id
                    ? 'Processing…'
                    : `Mark paid · ${formatPrice(Number(order.total))}`}
                </Text>
              </Pressable>
            </View>
          ))
        )}

        {/* <Button title="Logout" onPress={handleLogout} variant="secondary" style={styles.logout} /> */}
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
    textTransform: 'capitalize',
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  items: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logout: {
    marginTop: spacing.sectionGap,
  },
});
