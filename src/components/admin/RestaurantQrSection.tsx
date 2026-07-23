import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantTable } from '@/types/table';
import { buildRestaurantScanUrl, buildTableScanUrl } from '@/utils/buildScanUrl';

interface RestaurantQrSectionProps {
  restaurant: Restaurant;
  tables: RestaurantTable[];
}

function QrCard({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <View style={styles.qrCard}>
      <QRCode value={value} size={132} backgroundColor="#FFFFFF" color={colors.text} />
      <Text style={styles.qrTitle}>{title}</Text>
      <Text style={styles.qrSubtitle}>{subtitle}</Text>
      <Text style={styles.qrValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export function RestaurantQrSection({ restaurant, tables }: RestaurantQrSectionProps) {
  const restaurantUrl = buildRestaurantScanUrl(restaurant.scan_code);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>QR codes</Text>
      <Text style={styles.sectionHint}>
        Print these and place them on tables. Customers scan from the Menu tab in the app.
      </Text>

      <QrCard
        title="Restaurant QR"
        subtitle="Opens menu — customer picks table manually"
        value={restaurantUrl}
      />

      {tables.length > 0 ? (
        <>
          <Text style={styles.tableHeading}>Table QR codes</Text>
          <View style={styles.tableGrid}>
            {tables.map((table) => {
              const tableUrl = buildTableScanUrl(restaurant.scan_code, table.number);
              return (
                <QrCard
                  key={table.id}
                  title={`Table ${table.number}`}
                  subtitle={`${table.capacity} seats · auto-selects table`}
                  value={tableUrl}
                />
              );
            })}
          </View>
        </>
      ) : (
        <Text style={styles.emptyTables}>
          No tables yet. Run the table seed script or add tables from the admin panel.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  tableHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tableGrid: {
    gap: spacing.md,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
    marginBottom: spacing.md,
  },
  qrTitle: {
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  qrSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  qrValue: {
    marginTop: spacing.sm,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyTables: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
