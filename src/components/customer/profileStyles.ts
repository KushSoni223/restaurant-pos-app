import { StyleSheet } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export const profileScreenStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.screenBottom,
  },
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
    paddingBottom: 8,
    marginBottom: 20,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
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
