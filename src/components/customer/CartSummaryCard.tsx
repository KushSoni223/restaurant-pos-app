import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { OrderTotals } from '@/types/tax';
import { formatPrice } from '@/utils/formatPrice';

import { menuCardStyles } from './menuStyles';

interface CartSummaryCardProps {
  totals: OrderTotals;
  onCheckout: () => void;
  disabled?: boolean;
  checkoutLabel?: string;
}

export function CartSummaryCard({
  totals,
  onCheckout,
  disabled,
  checkoutLabel,
}: CartSummaryCardProps) {
  const buttonTitle =
    checkoutLabel ?? `Place order · ${formatPrice(totals.total)}`;

  return (
    <View style={[menuCardStyles.card, styles.card]}>
      <Text style={styles.title}>Order summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatPrice(totals.subtotal)}</Text>
      </View>

      {totals.showTax ? (
        <View style={styles.row}>
          <Text style={styles.label}>{totals.taxLabel}</Text>
          <Text style={styles.value}>{formatPrice(totals.tax)}</Text>
        </View>
      ) : null}

      {totals.showServiceCharge ? (
        <View style={styles.row}>
          <Text style={styles.label}>{totals.serviceChargeLabel}</Text>
          <Text style={styles.value}>{formatPrice(totals.serviceCharge)}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(totals.total)}</Text>
      </View>

      <Button
        title={buttonTitle}
        onPress={onCheckout}
        disabled={disabled}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.cardInner,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
    paddingRight: spacing.sm,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  button: {
    marginTop: spacing.lg,
  },
});
