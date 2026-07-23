import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listTables } from '@/api/tables';
import { Button } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { RestaurantTable, SelectedTable } from '@/types/table';
import { useCallback, useEffect, useRef, useState } from 'react';

import { RestaurantTableLayout } from './RestaurantTableLayout';

interface TablePickerModalProps {
  visible: boolean;
  restaurantId: number;
  restaurantName: string;
  restaurantTagline?: string | null;
  initialTable?: SelectedTable | null;
  requireSelection?: boolean;
  confirmLabel?: string;
  viewOnly?: boolean;
  onClose: () => void;
  onConfirm?: (table: SelectedTable) => void;
}

export function TablePickerModal({
  visible,
  restaurantId,
  restaurantName,
  restaurantTagline,
  initialTable,
  requireSelection = true,
  confirmLabel = 'Confirm table',
  viewOnly = false,
  onClose,
  onConfirm,
}: TablePickerModalProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(initialTable ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasVisibleRef = useRef(false);

  const loadTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listTables(restaurantId);
      setTables(list);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load tables.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setSelectedTable(initialTable ?? null);
      void loadTables();
    }
    wasVisibleRef.current = visible;
  }, [visible, loadTables, initialTable]);

  useEffect(() => {
    if (!visible || !initialTable || tables.length === 0) {
      return;
    }
    const matched = tables.find((table) => table.id === initialTable.id);
    setSelectedTable(matched ? { id: matched.id, number: matched.number } : initialTable);
  }, [visible, initialTable, tables]);

  const handleConfirm = () => {
    if (!selectedTable || !onConfirm) {
      return;
    }
    onConfirm(selectedTable);
  };

  const title = viewOnly ? 'Restaurant floor plan' : 'Select your table';
  const subtitle = viewOnly
    ? `${restaurantName} · architectural floor blueprint`
    : `${restaurantName} · tap your table on the floor plan`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : tables.length === 0 ? (
              <Text style={styles.error}>No tables configured for this restaurant yet.</Text>
            ) : (
              <RestaurantTableLayout
                tables={tables}
                restaurantName={restaurantName}
                restaurantTagline={restaurantTagline}
                selectedTableId={selectedTable?.id}
                onSelect={(table) => setSelectedTable({ id: table.id, number: table.number })}
              />
            )}
          </ScrollView>

          {selectedTable ? (
            <View style={styles.selectionBanner}>
              <Text style={styles.selectionText}>
                Table <Text style={styles.selectionStrong}>{selectedTable.number}</Text> · ID{' '}
                {selectedTable.id}
              </Text>
            </View>
          ) : requireSelection ? (
            <Text style={styles.hint}>Choose a table from the floor plan above.</Text>
          ) : null}

          {onConfirm ? (
            <Button
              title={
                selectedTable
                  ? confirmLabel.replace('{table}', selectedTable.number)
                  : 'Select a table'
              }
              onPress={handleConfirm}
              disabled={!selectedTable}
              style={styles.confirmButton}
            />
          ) : (
            <Button title="Close" onPress={onClose} style={styles.confirmButton} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    paddingRight: spacing.md,
  },
  close: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    paddingBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xxl,
  },
  error: {
    textAlign: 'center',
    color: colors.error,
    marginVertical: spacing.lg,
  },
  selectionBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectionText: {
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  selectionStrong: {
    fontWeight: '800',
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
});
