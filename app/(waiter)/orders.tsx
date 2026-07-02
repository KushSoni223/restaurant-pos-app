import { StyleSheet, Text } from 'react-native';

import { SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function WaiterOrdersScreen() {
  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Active Orders" subtitle="View and update order status" />
      <Text style={styles.placeholder}>Waiter POS — orders screen</Text>
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
