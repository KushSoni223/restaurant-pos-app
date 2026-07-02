import { StyleSheet, Text } from 'react-native';

import { SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function CustomerMenuScreen() {
  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Menu" subtitle="Browse dishes and add to cart" />
      <Text style={styles.placeholder}>Customer menu screen</Text>
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
