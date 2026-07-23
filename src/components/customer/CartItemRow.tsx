import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { CartLine } from '@/contexts/CartContext';
import { formatPrice } from '@/utils/formatPrice';

import { menuCardStyles } from './menuStyles';

const CATEGORY_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'fish-outline',
  2: 'pizza-outline',
  3: 'cafe-outline',
  4: 'ice-cream-outline',
};

interface CartItemRowProps {
  line: CartLine;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemRow({ line, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const { menuItem, quantity } = line;
  const lineTotal = menuItem.price * quantity;
  const iconName = CATEGORY_ICONS[menuItem.category_id] ?? 'restaurant-outline';

  return (
    <View style={[menuCardStyles.card, styles.card]}>
      <View style={styles.imageWrap}>
        <Ionicons name={iconName} size={24} color={colors.primaryDark} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {menuItem.name}
          </Text>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <Text style={styles.unitPrice}>{formatPrice(menuItem.price)} each</Text>

        <View style={styles.footer}>
          <View style={styles.stepper}>
            <Pressable onPress={onDecrease} style={styles.stepperButton}>
              <Ionicons name="remove" size={18} color={colors.primary} />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable onPress={onIncrease} style={styles.stepperButton}>
              <Ionicons name="add" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.lineTotal}>{formatPrice(lineTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  unitPrice: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
