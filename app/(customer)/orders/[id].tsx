import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getOrder, type ApiOrder, type ApiOrderStatus } from '@/api/orders';
import { EmptyState } from '@/components/customer';
import { Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { formatPrice } from '@/utils/formatPrice';

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

const STATUS_FLOW: ApiOrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED'];

const STATUS_PROGRESS: Record<ApiOrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 0,
  PREPARING: 1,
  READY: 2,
  SERVED: 3,
  PAID: 3,
  CANCELLED: -1,
};

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const data = await getOrder(Number(id));
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this order.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrder();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Screen layout="stack" scrollable={false} backgroundColor={colors.background}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !order) {
    return (
      <Screen layout="stack" scrollable={false} backgroundColor={colors.background}>
        <View style={styles.center}>
          <EmptyState
            icon="receipt-outline"
            title="Order not found"
            subtitle={error ?? 'This order could not be loaded.'}
          />
        </View>
      </Screen>
    );
  }

  const status = STATUS_CONFIG[order.status];
  const progress = STATUS_PROGRESS[order.status];
  const serviceCharge =
    Number(order.total) - Number(order.subtotal) - Number(order.tax);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `Order #${order.id}` }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderNumber}>ORD-{order.id}</Text>
              <Text style={styles.date}>{formatOrderDate(order.created_at)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={14} color={status.color} />
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {order.status !== 'CANCELLED' ? (
            <View style={styles.progressRow}>
              {STATUS_FLOW.map((step, index) => {
                const config = STATUS_CONFIG[step];
                const reached = progress >= index;
                return (
                  <View key={step} style={styles.progressStep}>
                    <View
                      style={[
                        styles.progressDot,
                        reached && styles.progressDotActive,
                      ]}
                    >
                      <Ionicons
                        name={config.icon}
                        size={14}
                        color={reached ? colors.surface : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[styles.progressLabel, reached && styles.progressLabelActive]}
                    >
                      {config.label}
                    </Text>
                    {index < STATUS_FLOW.length - 1 ? (
                      <View
                        style={[
                          styles.progressLine,
                          progress > index && styles.progressLineActive,
                        ]}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {order.table_number ? (
          <View style={[styles.card, styles.tableCard]}>
            <View style={styles.tableIcon}>
              <Ionicons name="grid-outline" size={18} color={colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.tableLabel}>Your table</Text>
              <Text style={styles.tableValue}>
                Table {order.table_number}
                {order.table_id != null ? ` · ID ${order.table_id}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.itemRow, index > 0 && styles.itemRowBorder]}
            >
              <View style={styles.itemQty}>
                <Text style={styles.itemQtyText}>{item.quantity}×</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.menu_item_name ?? `Item ${item.menu_item_id}`}
                </Text>
                <Text style={styles.itemUnit}>{formatPrice(Number(item.unit_price))} each</Text>
                {item.notes ? <Text style={styles.itemNotes}>“{item.notes}”</Text> : null}
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(Number(item.unit_price) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.subtotal))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.tax))}</Text>
          </View>
          {serviceCharge > 0.001 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service charge</Text>
              <Text style={styles.summaryValue}>{formatPrice(serviceCharge)}</Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(Number(order.total))}</Text>
          </View>
        </View>

        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{order.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
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
  progressRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressLabelActive: {
    color: colors.primaryDark,
  },
  progressLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.border,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tableIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemQty: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemUnit: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  itemNotes: {
    marginTop: 4,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  notes: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
