import { StyleSheet, Text } from 'react-native';

import { SAFE_AREA_TAB, Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function AdminMenuManagementScreen() {
  return (
    <Screen edges={SAFE_AREA_TAB} contentStyle={styles.content}>
      <ScreenHeader title="Menu Management" subtitle="Add, edit, and remove menu items" />
      <Text style={styles.placeholder}>Admin — menu management screen</Text>
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
