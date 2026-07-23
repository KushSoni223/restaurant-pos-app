import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listTables, updateTableStatus } from '@/api/tables';
import { RestaurantTableLayout, ScreenIntro } from '@/components/customer';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useWaiterSession } from '@/contexts/WaiterSessionContext';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantTable, TableStatus } from '@/types/table';

const STATUS_ACTIONS: { status: TableStatus; label: string }[] = [
  { status: 'AVAILABLE', label: 'Available' },
  { status: 'OCCUPIED', label: 'Occupied' },
  { status: 'RESERVED', label: 'Reserved' },
  { status: 'CLEANING', label: 'Cleaning' },
];

export default function WaiterTablesScreen() {
  const { restaurant, table, restaurants, isLoading, setRestaurant, setTable } =
    useWaiterSession();
  const { layoutParts } = useScreenLayout('tabHeaderless');
  const { showError, showSuccess } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingTableId, setUpdatingTableId] = useState<number | null>(null);

  const loadTables = useCallback(async () => {
    if (!restaurant) {
      setTables([]);
      return;
    }
    setIsTablesLoading(true);
    try {
      const list = await listTables(restaurant.id, { sync: true });
      setTables(list);
    } catch (error) {
      showError(
        'Could not load tables',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    } finally {
      setIsTablesLoading(false);
    }
  }, [restaurant, showError]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTables();
    setIsRefreshing(false);
  };

  const handleSelectRestaurant = async (next: Restaurant) => {
    await setRestaurant(next);
  };

  const handleTableSelect = async (selected: RestaurantTable) => {
    await setTable({ id: selected.id, number: selected.number });
    showSuccess('Table selected', `Table ${selected.number} is ready for ordering.`);
  };

  const handleStatusChange = async (tableId: number, status: TableStatus) => {
    setUpdatingTableId(tableId);
    try {
      await updateTableStatus(tableId, status);
      setTables((current) =>
        current.map((item) => (item.id === tableId ? { ...item, status } : item)),
      );
      showSuccess('Table updated', `Status set to ${status.toLowerCase()}.`);
    } catch (error) {
      showError(
        'Update failed',
        error instanceof Error ? error.message : 'Could not update table status.',
      );
    } finally {
      setUpdatingTableId(null);
    }
  };

  const selectedTableData = table ? tables.find((item) => item.id === table.id) : null;
  const canTakeOrder = selectedTableData?.status === 'AVAILABLE';

  return (
    <View style={styles.screen}>
      <View style={layoutParts.header}>
        <ScreenIntro
          title="Floor plan"
          subtitle={
            restaurant
              ? `${restaurant.name}${table ? ` · Table ${table.number} selected` : ''}`
              : 'Select a restaurant to begin'
          }
          icon="grid-outline"
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={layoutParts.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : restaurants.length > 1 ? (
          <View style={styles.restaurantRow}>
            {restaurants.map((item) => {
              const active = restaurant?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectRestaurant(item)}
                  style={[styles.restaurantChip, active && styles.restaurantChipActive]}
                >
                  <Text
                    style={[styles.restaurantChipText, active && styles.restaurantChipTextActive]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!restaurant ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No restaurant selected</Text>
            <Text style={styles.emptySubtitle}>Choose a restaurant to view the floor plan.</Text>
          </View>
        ) : isTablesLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.hint}>Tap a table to select it for ordering.</Text>
            <RestaurantTableLayout
              tables={tables}
              restaurantName={restaurant.name}
              restaurantTagline={restaurant.tagline}
              selectedTableId={table?.id}
              onSelect={handleTableSelect}
            />

            {selectedTableData ? (
              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Table {selectedTableData.number}</Text>
                <Text style={styles.statusSubtitle}>
                  Current status: {selectedTableData.status.toLowerCase()}
                </Text>
                <View style={styles.statusActions}>
                  {STATUS_ACTIONS.map((action) => (
                    <Pressable
                      key={action.status}
                      disabled={updatingTableId === selectedTableData.id}
                      onPress={() => handleStatusChange(selectedTableData.id, action.status)}
                      style={[
                        styles.statusButton,
                        selectedTableData.status === action.status && styles.statusButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          selectedTableData.status === action.status &&
                            styles.statusButtonTextActive,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {!canTakeOrder ? (
                  <Text style={styles.takeOrderHint}>
                    Table must be available to start a new order.
                  </Text>
                ) : null}
                <Pressable
                  disabled={!canTakeOrder}
                  onPress={() => router.push('/(waiter)/take-order')}
                  style={[styles.takeOrderButton, !canTakeOrder && styles.takeOrderButtonDisabled]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={canTakeOrder ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[styles.takeOrderText, !canTakeOrder && styles.takeOrderTextDisabled]}
                  >
                    Take order for table {selectedTableData.number}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: { flex: 1 },
  loader: { marginVertical: spacing.xxl },
  restaurantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  restaurantChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  restaurantChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  restaurantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  restaurantChipTextActive: {
    color: colors.primaryDark,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statusCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  statusButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusButtonTextActive: {
    color: colors.primaryDark,
  },
  takeOrderHint: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  takeOrderButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  takeOrderButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  takeOrderText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  takeOrderTextDisabled: {
    color: colors.textMuted,
  },
});
