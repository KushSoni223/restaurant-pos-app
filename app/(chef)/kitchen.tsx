import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  fetchKitchenQueue,
  updateOrderStatus,
  type ApiOrder,
  type ApiOrderStatus,
} from '@/api/orders';
import { Button, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useLogout';
import { useToast } from '@/hooks/useToast';

const QUEUE_POLL_MS = 15000;

function nextAction(status: ApiOrderStatus): { label: string; next: ApiOrderStatus } | null {
  if (status === 'PENDING' || status === 'CONFIRMED') {
    return { label: 'Start preparing', next: 'PREPARING' };
  }
  if (status === 'PREPARING') {
    return { label: 'Mark ready', next: 'READY' };
  }
  return null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChefKitchenScreen() {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const { showError, showSuccess } = useToast();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const queue = await fetchKitchenQueue(user.id);
      setOrders(queue);
    } catch (error) {
      showError(
        'Could not load queue',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    }
  }, [user, showError]);

  useEffect(() => {
    loadQueue().finally(() => setIsLoading(false));
    const interval = setInterval(loadQueue, QUEUE_POLL_MS);
    return () => clearInterval(interval);
  }, [loadQueue]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadQueue();
    setIsRefreshing(false);
  };

  const handleAdvance = async (order: ApiOrder) => {
    const action = nextAction(order.status);
    if (!action) {
      return;
    }

    setUpdatingOrderId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, action.next, true);
      if (updated.status === 'READY') {
        setOrders((current) => current.filter((o) => o.id !== order.id));
        showSuccess('Order ready', `Order #${order.id} is ready to serve.`);
      } else {
        setOrders((current) => current.map((o) => (o.id === order.id ? updated : o)));
      }
    } catch (error) {
      showError(
        'Update failed',
        error instanceof Error ? error.message : 'Could not update the order.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <Screen
      layout="stack"
      scrollable={false}
      keyboardAware={false}
      backgroundColor={colors.background}
    >
      <ScreenHeader
        title={`Kitchen queue${user?.name ? ` — ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Orders assigned to you, oldest first"
      />

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flame-outline" size={32} color={colors.primaryDark} />
            </View>
            <Text style={styles.emptyTitle}>No orders in your queue</Text>
            <Text style={styles.emptySubtitle}>
              New orders for your areas will appear here automatically. Pull down to refresh.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const action = nextAction(order.status);
            const myItems = order.items.filter((item) => item.chef_id === user?.id);
            const otherItems = order.items.filter((item) => item.chef_id !== user?.id);

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Order #{order.id}</Text>
                    <Text style={styles.orderTime}>
                      {formatTime(order.created_at)}
                      {order.table_id ? ` · Table ${order.table_id}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      order.status === 'PREPARING' && styles.statusBadgePreparing,
                    ]}
                  >
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.itemsBlock}>
                  {myItems.map((item) => (
                    <Text key={item.id} style={styles.itemLine}>
                      {item.quantity}× {item.menu_item_name ?? `Item ${item.menu_item_id}`}
                      {item.notes ? `  —  ${item.notes}` : ''}
                    </Text>
                  ))}
                  {otherItems.length > 0 ? (
                    <Text style={styles.otherItems}>
                      +{otherItems.length} item{otherItems.length === 1 ? '' : 's'} with other chefs
                    </Text>
                  ) : null}
                </View>

                {order.notes ? <Text style={styles.orderNotes}>Note: {order.notes}</Text> : null}

                {action ? (
                  <Pressable
                    onPress={() => handleAdvance(order)}
                    disabled={updatingOrderId === order.id}
                    style={[
                      styles.actionButton,
                      updatingOrderId === order.id && styles.actionButtonDisabled,
                    ]}
                  >
                    <Text style={styles.actionText}>
                      {updatingOrderId === order.id ? 'Updating…' : action.label}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}

        <Button title="Logout" onPress={handleLogout} variant="secondary" style={styles.logout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.screenBottom,
  },
  loader: {
    marginTop: spacing.xxl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  orderTime: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgePreparing: {
    backgroundColor: colors.primaryLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  itemsBlock: {
    gap: 4,
  },
  itemLine: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  otherItems: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderNotes: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logout: {
    marginTop: spacing.sectionGap,
  },
});
