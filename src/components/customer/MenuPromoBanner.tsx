import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { Offer } from '@/types/offer';

interface MenuPromoBannerProps {
  offer: Offer;
}

export function MenuPromoBanner({ offer }: MenuPromoBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{offer.badge_text}</Text>
        </View>
        <Text style={styles.title}>{offer.title}</Text>
        {offer.subtitle ? <Text style={styles.subtitle}>{offer.subtitle}</Text> : null}
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={28} color={colors.primaryDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: spacing.cardInner,
    marginBottom: spacing.sectionGap,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
