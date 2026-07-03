import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface ProfileInfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function ProfileInfoRow({ label, value, isLast = false }: ProfileInfoRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.cardInner,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
});
