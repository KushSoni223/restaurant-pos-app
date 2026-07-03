import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface ProfileMenuItemProps {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
  showChevron = true,
}: ProfileMenuItemProps) {
  const tint = destructive ? colors.error : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: destructive ? '#FEF2F2' : colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, destructive && styles.destructiveText]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.cardInner,
    paddingVertical: 14,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  destructiveText: {
    color: colors.error,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
});
