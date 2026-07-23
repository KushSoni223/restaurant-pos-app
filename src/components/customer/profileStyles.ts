import { StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export const profileScreenStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.cardInner,
    paddingTop: spacing.cardInner,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sectionGap,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  readOnlyNote: {
    marginTop: -10,
    marginBottom: 14,
    fontSize: 12,
    color: colors.textMuted,
  },
  actionButton: {
    marginHorizontal: spacing.cardInner,
  },
});
