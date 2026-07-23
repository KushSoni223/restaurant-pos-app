import { StyleSheet, Text } from 'react-native';

import { Screen, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';

export default function AdminMenuManagementScreen() {
  return (
    <Screen layout="tab">
      <ScreenHeader title="Menu Management" subtitle="Add, edit, and remove menu items" />
      <Text style={styles.placeholder}>Admin — menu management screen</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    color: colors.textMuted,
  },
});
