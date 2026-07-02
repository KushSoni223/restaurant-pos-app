import { StyleSheet, Text } from 'react-native';

import { SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function WaiterTablesScreen() {
  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Tables" subtitle="Manage table status and seating" />
      <Text style={styles.placeholder}>Waiter POS — tables screen</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  placeholder: {
    color: colors.textMuted,
  },
});
