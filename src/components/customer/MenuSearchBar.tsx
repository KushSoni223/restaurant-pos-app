import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface MenuSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  filtersActive?: boolean;
  filtersOpen?: boolean;
}

export function MenuSearchBar({
  value,
  onChangeText,
  onClear,
  onFilterPress,
  filtersActive = false,
  filtersOpen = false,
}: MenuSearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search dishes, drinks..."
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel={filtersOpen ? 'Close menu filters' : 'Open menu filters'}
        hitSlop={6}
        style={[styles.filterPill, (filtersActive || filtersOpen) && styles.filterPillActive]}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={filtersActive || filtersOpen ? '#FFFFFF' : colors.primaryDark}
        />
        {filtersActive && !filtersOpen ? <View style={styles.activeDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: spacing.sectionGap,
    minHeight: 48,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primaryDark,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
