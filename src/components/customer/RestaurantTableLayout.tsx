import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { RestaurantTable } from '@/types/table';

const BLUEPRINT = {
  canvas: '#0A2342',
  grid: 'rgba(125, 211, 252, 0.12)',
  line: 'rgba(125, 211, 252, 0.35)',
  label: '#7DD3FC',
  text: '#E0F2FE',
  muted: '#93C5FD',
};

const STATUS_THEME: Record<
  RestaurantTable['status'],
  { table: string; border: string; chair: string; glow: string }
> = {
  AVAILABLE: {
    table: '#14532D',
    border: '#4ADE80',
    chair: '#86EFAC',
    glow: 'rgba(74, 222, 128, 0.35)',
  },
  OCCUPIED: {
    table: '#7F1D1D',
    border: '#F87171',
    chair: '#FCA5A5',
    glow: 'rgba(248, 113, 113, 0.35)',
  },
  RESERVED: {
    table: '#78350F',
    border: '#FBBF24',
    chair: '#FCD34D',
    glow: 'rgba(251, 191, 36, 0.35)',
  },
  CLEANING: {
    table: '#374151',
    border: '#9CA3AF',
    chair: '#D1D5DB',
    glow: 'rgba(156, 163, 175, 0.25)',
  },
};

interface ChairOffset {
  x: number;
  y: number;
}

function getChairOffsets(capacity: number): ChairOffset[] {
  if (capacity <= 2) {
    return [
      { x: 0, y: -26 },
      { x: 0, y: 26 },
    ];
  }
  if (capacity <= 4) {
    return [
      { x: 0, y: -28 },
      { x: 0, y: 28 },
      { x: -28, y: 0 },
      { x: 28, y: 0 },
    ];
  }
  return [
    { x: -20, y: -24 },
    { x: 20, y: -24 },
    { x: -32, y: 0 },
    { x: 32, y: 0 },
    { x: -20, y: 24 },
    { x: 20, y: 24 },
  ];
}

interface BlueprintTableProps {
  table: RestaurantTable;
  selected: boolean;
  selectable: boolean;
  onPress: () => void;
}

function BlueprintTable({ table, selected, selectable, onPress }: BlueprintTableProps) {
  const theme = STATUS_THEME[table.status];
  const chairs = getChairOffsets(table.capacity);
  const isLarge = table.capacity > 4;

  return (
    <Pressable
      onPress={onPress}
      disabled={!selectable}
      style={({ pressed }) => [
        styles.tableWrap,
        pressed && selectable && styles.tableWrapPressed,
        !selectable && styles.tableWrapDisabled,
      ]}
    >
      {selected ? <View style={[styles.glow, { shadowColor: theme.border }]} /> : null}

      {chairs.map((chair, index) => (
        <View
          key={`${table.id}-chair-${index}`}
          style={[
            styles.chair,
            {
              backgroundColor: theme.chair,
              left: '50%',
              top: '50%',
              marginLeft: chair.x - 5,
              marginTop: chair.y - 4,
            },
          ]}
        />
      ))}

      <View
        style={[
          isLarge ? styles.tableRect : styles.tableRound,
          {
            backgroundColor: theme.table,
            borderColor: selected ? '#FBBF24' : theme.border,
            borderWidth: selected ? 3 : 2,
          },
        ]}
      >
        <Text style={styles.tableNumber}>{table.number}</Text>
      </View>

      <Text style={styles.tableId}>ID {table.id}</Text>

      {selected ? (
        <View style={styles.selectedPin}>
          <Ionicons name="checkmark" size={10} color="#0A2342" />
        </View>
      ) : null}
    </Pressable>
  );
}

interface RestaurantTableLayoutProps {
  tables: RestaurantTable[];
  restaurantName?: string;
  restaurantTagline?: string | null;
  selectedTableId?: number | null;
  onSelect: (table: RestaurantTable) => void;
}

export function RestaurantTableLayout({
  tables,
  restaurantName = 'Restaurant',
  restaurantTagline,
  selectedTableId,
  onSelect,
}: RestaurantTableLayoutProps) {
  const sortedTables = [...tables].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true }),
  );
  const initials = restaurantName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.wrapper}>
      <View style={styles.blueprint}>
        <BlueprintGrid />

        <View style={styles.blueprintHeader}>
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitials}>{initials || 'R'}</Text>
            </View>
            <View style={styles.logoText}>
              <Text style={styles.logoName}>{restaurantName.toUpperCase()}</Text>
              {restaurantTagline ? (
                <Text style={styles.logoTagline}>{restaurantTagline}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.compass}>
            <Ionicons name="navigate-outline" size={12} color={BLUEPRINT.label} />
            <Text style={styles.compassText}>N</Text>
          </View>
        </View>

        <View style={styles.kitchenBar}>
          <Ionicons name="flame-outline" size={14} color={BLUEPRINT.label} />
          <Text style={styles.kitchenText}>Kitchen · Bar · Service</Text>
        </View>

        <View style={styles.diningRoom}>
          <DiningZone
            label="Window dining"
            icon="sunny-outline"
            tables={sortedTables.slice(0, 4)}
            selectedTableId={selectedTableId}
            onSelect={onSelect}
          />
          <DiningZone
            label="Main hall"
            icon="restaurant-outline"
            tables={sortedTables.slice(4, 8)}
            selectedTableId={selectedTableId}
            onSelect={onSelect}
            prominent
          />
          <DiningZone
            label="Patio"
            icon="leaf-outline"
            tables={sortedTables.slice(8, 12)}
            selectedTableId={selectedTableId}
            onSelect={onSelect}
          />
        </View>

        <View style={styles.entrance}>
          <Ionicons name="enter-outline" size={14} color={BLUEPRINT.label} />
          <Text style={styles.entranceText}>Entrance</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {Object.entries(STATUS_THEME).map(([status, theme]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendChair, { backgroundColor: theme.chair }]} />
            <View style={[styles.legendTable, { backgroundColor: theme.table, borderColor: theme.border }]} />
            <Text style={styles.legendText}>{status.toLowerCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface DiningZoneProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tables: RestaurantTable[];
  selectedTableId?: number | null;
  onSelect: (table: RestaurantTable) => void;
  prominent?: boolean;
}

function DiningZone({
  label,
  icon,
  tables,
  selectedTableId,
  onSelect,
  prominent = false,
}: DiningZoneProps) {
  return (
    <View style={[styles.zone, prominent && styles.zoneProminent]}>
      <View style={styles.zoneHeader}>
        <Ionicons name={icon} size={11} color={BLUEPRINT.label} />
        <Text style={styles.zoneLabel}>{label}</Text>
      </View>
      <View style={styles.zoneTables}>
        {tables.map((table) => {
          const selected = table.id === selectedTableId;
          const selectable = table.status === 'AVAILABLE' || selected;
          return (
            <BlueprintTable
              key={table.id}
              table={table}
              selected={selected}
              selectable={selectable}
              onPress={() => selectable && onSelect(table)}
            />
          );
        })}
      </View>
    </View>
  );
}

function BlueprintGrid() {
  const horizontal = Array.from({ length: 12 }, (_, i) => i);
  const vertical = Array.from({ length: 8 }, (_, i) => i);

  return (
    <View style={styles.gridOverlay} pointerEvents="none">
      {horizontal.map((i) => (
        <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i / 11) * 100}%` }]} />
      ))}
      {vertical.map((i) => (
        <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i / 7) * 100}%` }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  blueprint: {
    backgroundColor: BLUEPRINT.canvas,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BLUEPRINT.line,
    height: 590,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: BLUEPRINT.grid,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BLUEPRINT.grid,
  },
  blueprintHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: BLUEPRINT.line,
  },
  logoBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BLUEPRINT.label,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 116, 144, 0.35)',
  },
  logoInitials: {
    color: BLUEPRINT.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoText: {
    flex: 1,
  },
  logoName: {
    color: BLUEPRINT.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  logoTagline: {
    color: BLUEPRINT.muted,
    fontSize: 10,
    marginTop: 2,
  },
  kitchenBar: {
    height: 36,
    marginHorizontal: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: BLUEPRINT.line,
    borderStyle: 'dashed',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  kitchenText: {
    color: BLUEPRINT.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  diningRoom: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  zone: {
    flex: 1,
    borderWidth: 1,
    borderColor: BLUEPRINT.line,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 116, 144, 0.08)',
    overflow: 'hidden',
  },
  zoneProminent: {
    flex: 1.12,
    backgroundColor: 'rgba(14, 116, 144, 0.14)',
  },
  zoneHeader: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: BLUEPRINT.line,
  },
  zoneLabel: {
    color: BLUEPRINT.label,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  zoneTables: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
  },
  tableWrap: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableWrapPressed: {
    opacity: 0.9,
  },
  tableWrapDisabled: {
    opacity: 0.45,
  },
  glow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  chair: {
    position: 'absolute',
    width: 10,
    height: 8,
    borderRadius: 2,
  },
  tableRound: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRect: {
    width: 54,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  tableId: {
    position: 'absolute',
    bottom: 0,
    color: BLUEPRINT.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedPin: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrance: {
    alignSelf: 'center',
    width: 120,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: BLUEPRINT.line,
  },
  entranceText: {
    color: BLUEPRINT.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  compass: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BLUEPRINT.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  compassText: {
    color: BLUEPRINT.label,
    fontSize: 10,
    fontWeight: '800',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendChair: {
    width: 8,
    height: 6,
    borderRadius: 1,
  },
  legendTable: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
});
