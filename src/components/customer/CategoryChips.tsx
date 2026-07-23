import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { MenuCategory } from '@/types/menu';

interface CategoryChipsProps {
  categories: MenuCategory[];
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
}

type ChipKey = 'all' | number;

export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Partial<Record<ChipKey, { x: number; width: number }>>>({});

  const scrollChipIntoView = useCallback((key: ChipKey) => {
    const layout = chipLayouts.current[key];
    if (!layout || !scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      x: Math.max(0, layout.x - spacing.screenHorizontal),
      animated: true,
    });
  }, []);

  const handleSelect = useCallback(
    (key: ChipKey, categoryId: number | null) => {
      onSelect(categoryId);
      requestAnimationFrame(() => scrollChipIntoView(key));
    },
    [onSelect, scrollChipIntoView],
  );

  const registerChipLayout = useCallback((key: ChipKey, x: number, width: number) => {
    chipLayouts.current[key] = { x, width };
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <Chip
        label="All"
        active={selectedId === null}
        onPress={() => handleSelect('all', null)}
        onLayout={(x, width) => registerChipLayout('all', x, width)}
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          active={selectedId === category.id}
          onPress={() => handleSelect(category.id, category.id)}
          onLayout={(x, width) => registerChipLayout(category.id, x, width)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
}

function Chip({ label, active, onPress, onLayout }: ChipProps) {
  return (
    <View
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        onLayout(x, width);
      }}
    >
      <Pressable
        onPress={onPress}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: spacing.sectionGap,
    flexGrow: 0,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
