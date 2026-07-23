import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { CustomerOrder, OrderStatus } from '@/types/order';
import { formatPrice } from '@/utils/formatPrice';

import { menuCardStyles } from './menuStyles';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { label: 'Pending', color: '#B45309', bg: colors.primaryLight, icon: 'time-outline' },
  preparing: {
    label: 'Preparing',
    color: '#B45309',
    bg: colors.primaryLight,
    icon: 'flame-outline',
  },
  ready: { label: 'Ready', color: colors.success, bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  completed: {
    label: 'Completed',
    color: colors.textMuted,
    bg: '#F3F4F6',
    icon: 'checkmark-done-outline',
  },
  cancelled: {
    label: 'Cancelled',
    color: colors.error,
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
  },
};

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Today · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface OrderCardProps {
  order: CustomerOrder;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const status = STATUS_CONFIG[order.status];
  const itemSummary = order.items
    .map((item) => `${item.quantity}× ${item.name}`)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        menuCardStyles.card,
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
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
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {order.estimatedMinutes && order.status === 'preparing' ? (
          <Text style={styles.eta}>~{order.estimatedMinutes} min</Text>
        ) : onPress ? (
          <View style={styles.detailsHint}>
            <Text style={styles.detailsHintText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.cardInner,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  orderNumber: {
    fontSize: 16,
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
  items: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  total: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  eta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
