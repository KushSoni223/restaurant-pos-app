import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface ViewFloorPlanButtonProps {
  onPress: () => void;
  label?: string;
}

export function ViewFloorPlanButton({
  onPress,
  label = 'View floor blueprint',
}: ViewFloorPlanButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons name="grid-outline" size={18} color={colors.primaryDark} />
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sectionGap,
  },
  buttonPressed: {
    backgroundColor: colors.background,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
