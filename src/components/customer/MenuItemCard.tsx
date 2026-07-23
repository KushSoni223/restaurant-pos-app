import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { MenuItem } from '@/types/menu';
import { formatPrice } from '@/utils/formatPrice';

import { menuCardStyles } from './menuStyles';

const CATEGORY_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'fish-outline',
  2: 'pizza-outline',
  3: 'cafe-outline',
  4: 'ice-cream-outline',
};

interface MenuItemImageProps {
  categoryId: number;
  compact?: boolean;
}

function MenuItemImage({ categoryId, compact }: MenuItemImageProps) {
  const iconName = CATEGORY_ICONS[categoryId] ?? 'restaurant-outline';

  return (
    <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
      <View style={styles.imageInner}>
        <Ionicons name={iconName} size={compact ? 22 : 28} color={colors.primaryDark} />
      </View>
    </View>
  );
}

interface FeaturedItemCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export function FeaturedItemCard({ item, onAdd }: FeaturedItemCardProps) {
  return (
    <View style={[menuCardStyles.card, styles.card]}>
      <MenuItemImage categoryId={item.category_id} compact />
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.price}>{formatPrice(item.price)}</Text>
      <Pressable
        onPress={onAdd}
        disabled={!item.is_available}
        style={[styles.addButton, !item.is_available && styles.addButtonDisabled]}
      >
        <Ionicons name="add" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
}

export function MenuItemCard({ item, quantity, onAdd }: MenuItemCardProps) {
  return (
    <View style={[menuCardStyles.card, styles.listCard]}>
      <MenuItemImage categoryId={item.category_id} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.listName} numberOfLines={1}>
            {item.name}
          </Text>
          {!item.is_available ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Sold out</Text>
            </View>
          ) : null}
        </View>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <View>
            <Text style={styles.listPrice}>{formatPrice(item.price)}</Text>
            {item.prep_time_minutes ? (
              <Text style={styles.prepTime}>{item.prep_time_minutes} min</Text>
            ) : null}
          </View>
          <Pressable
            onPress={onAdd}
            disabled={!item.is_available}
            style={[
              styles.cartButton,
              quantity > 0 && styles.cartButtonActive,
              !item.is_available && styles.addButtonDisabled,
            ]}
          >
            {quantity > 0 ? (
              <Text style={styles.quantityText}>{quantity}</Text>
            ) : (
              <Ionicons
                name="add"
                size={20}
                color={item.is_available ? colors.primary : colors.textMuted}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    padding: 4,
  },
  imageWrapCompact: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginBottom: 10,
  },
  imageInner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 140,
    padding: 12,
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  addButton: {
    alignSelf: 'flex-start',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  listCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
  },
  body: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  soldOutBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  listPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  prepTime: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cartButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
