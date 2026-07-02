import { StyleSheet, Text } from 'react-native';

import { SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function WaiterTakeOrderScreen() {
  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Take Order" subtitle="Add items to active table order" />
      <Text style={styles.placeholder}>Waiter POS — take order screen</Text>
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
