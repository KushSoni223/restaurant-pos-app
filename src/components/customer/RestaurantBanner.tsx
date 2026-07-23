import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantBannerProps {
  restaurant: Restaurant;
  onChange: () => void;
}

export function RestaurantBanner({ restaurant, onChange }: RestaurantBannerProps) {
  return (
    <Pressable onPress={onChange} style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="storefront-outline" size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>Ordering at</Text>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {restaurant.tagline ? (
          <Text style={styles.tagline} numberOfLines={1}>
            {restaurant.tagline}
          </Text>
        ) : null}
      </View>
      <View style={styles.changeWrap}>
        <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
        <Text style={styles.changeText}>Change</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.md,
    marginBottom: spacing.sectionGap,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  tagline: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  changeWrap: {
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing.sm,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});
