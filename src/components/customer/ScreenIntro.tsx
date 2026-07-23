import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ScreenIntroProps {
  title: string;
  subtitle: string;
  icon: IoniconName;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function ScreenIntro({ title, subtitle, icon, action }: ScreenIntroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {action ? (
          <Pressable onPress={action.onPress} style={styles.action}>
            <Text style={styles.actionText}>{action.label}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={22} color={colors.primaryDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sectionGap,
  },
  textBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
